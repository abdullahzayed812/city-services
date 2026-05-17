import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

export default function WithdrawScreen({navigation}: Props) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');

  const {data: wallet} = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await apiClient.get('/wallets/me');
      return res.data.data;
    },
  });

  const withdraw = useMutation({
    mutationFn: async () => {
      await apiClient.post('/wallets/withdraw', {
        amount: parseFloat(amount),
        bankAccount,
        bankName,
      });
    },
    onSuccess: () => {
      Alert.alert('تم', 'تم إرسال طلب السحب بنجاح. سيتم المراجعة خلال 24 ساعة.');
      qc.invalidateQueries({queryKey: ['wallet']});
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const handleWithdraw = () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 50) {
      Alert.alert('خطأ', ar.wallet.minWithdraw);
      return;
    }
    if (!bankAccount) {
      Alert.alert('خطأ', 'أدخل رقم الحساب البنكي');
      return;
    }
    Alert.alert('تأكيد', `هل تريد سحب ${amt} ${ar.common.egp}؟`, [
      {text: ar.common.cancel, style: 'cancel'},
      {text: ar.wallet.confirmWithdraw, onPress: () => withdraw.mutate()},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>الرصيد المتاح</Text>
        <Text style={styles.balanceAmount}>{wallet?.balance ?? 0} {ar.common.egp}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{ar.wallet.withdrawAmount}</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          textAlign="right"
          placeholder="50"
        />
        <Text style={styles.hint}>{ar.wallet.minWithdraw}</Text>

        <Text style={styles.label}>اسم البنك</Text>
        <TextInput
          style={styles.input}
          value={bankName}
          onChangeText={setBankName}
          textAlign="right"
          placeholder="CIB / مصرف أبو ظبي / البنك الأهلي..."
        />

        <Text style={styles.label}>{ar.wallet.bankAccount}</Text>
        <TextInput
          style={styles.input}
          value={bankAccount}
          onChangeText={setBankAccount}
          keyboardType="number-pad"
          textAlign="right"
          placeholder="رقم الحساب أو IBAN"
        />

        <TouchableOpacity
          style={[styles.btn, withdraw.isPending && styles.btnDisabled]}
          onPress={handleWithdraw}
          disabled={withdraw.isPending}>
          {withdraw.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{ar.wallet.confirmWithdraw}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  balanceCard: {backgroundColor: '#1a237e', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24},
  balanceLabel: {color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6, fontFamily: 'Cairo-Regular'},
  balanceAmount: {color: '#fff', fontSize: 28, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  form: {backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2},
  label: {fontSize: 13, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 6, backgroundColor: '#fafafa'},
  hint: {fontSize: 11, color: '#888', marginBottom: 16, fontFamily: 'Cairo-Regular'},
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
});
