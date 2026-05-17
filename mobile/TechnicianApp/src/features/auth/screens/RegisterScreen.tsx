import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

const SPECIALTIES = [
  'سباكة', 'كهرباء', 'نجارة', 'تكييف', 'دهانات', 'أجهزة منزلية',
  'حدادة', 'بناء', 'تنظيف', 'أمن وكاميرات', 'شبكات', 'أخرى',
];

export default function RegisterScreen({navigation}: Props) {
  const [form, setForm] = useState({
    phone: '', password: '', confirmPassword: '', fullName: '',
    specialty: '', experienceYears: '', nationalId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSpecialties, setShowSpecialties] = useState(false);

  const update = (key: string, val: string) => setForm(f => ({...f, [key]: val}));

  const handleRegister = async () => {
    if (!form.phone || !form.password || !form.fullName || !form.specialty) {
      setError(ar.validation.required);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(ar.validation.passwordMismatch);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/register', {
        phone: form.phone,
        password: form.password,
        fullName: form.fullName,
        role: 'technician',
        specialty: form.specialty,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        nationalId: form.nationalId,
      });
      navigation.navigate('OTP', {phone: form.phone, purpose: 'register'});
    } catch (err: any) {
      setError(err.response?.data?.message ?? ar.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{ar.auth.register}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{ar.auth.fullName}</Text>
        <TextInput style={styles.input} value={form.fullName} onChangeText={v => update('fullName', v)} textAlign="right" />

        <Text style={styles.label}>{ar.auth.phone}</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" textAlign="right" />

        <Text style={styles.label}>{ar.auth.password}</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={v => update('password', v)} secureTextEntry textAlign="right" />

        <Text style={styles.label}>{ar.auth.confirmPassword}</Text>
        <TextInput style={styles.input} value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} secureTextEntry textAlign="right" />

        <Text style={styles.label}>{ar.auth.specialty}</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowSpecialties(!showSpecialties)}>
          <Text style={[styles.selectText, !form.specialty && {color: '#999'}]}>
            {form.specialty || 'اختر تخصصك'}
          </Text>
        </TouchableOpacity>
        {showSpecialties && (
          <View style={styles.specialtyList}>
            {SPECIALTIES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.specialtyItem, form.specialty === s && styles.specialtySelected]}
                onPress={() => {update('specialty', s); setShowSpecialties(false);}}>
                <Text style={[styles.specialtyText, form.specialty === s && {color: '#fff'}]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>{ar.auth.experience}</Text>
        <TextInput style={styles.input} value={form.experienceYears} onChangeText={v => update('experienceYears', v)} keyboardType="number-pad" textAlign="right" />

        <Text style={styles.label}>{ar.auth.nationalId}</Text>
        <TextInput style={styles.input} value={form.nationalId} onChangeText={v => update('nationalId', v)} keyboardType="number-pad" textAlign="right" />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{ar.auth.register}</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.hintText}>{ar.auth.haveAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}> {ar.auth.loginNow}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  scroll: {flexGrow: 1, padding: 24},
  title: {fontSize: 22, fontWeight: 'bold', color: '#1a237e', textAlign: 'center', marginBottom: 24, fontFamily: 'Cairo-Bold'},
  error: {color: '#e53935', textAlign: 'center', marginBottom: 12, fontFamily: 'Cairo-Regular'},
  label: {fontSize: 13, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    marginBottom: 14, backgroundColor: '#fff', fontFamily: 'Cairo-Regular',
  },
  selectText: {fontSize: 15, color: '#333', fontFamily: 'Cairo-Regular'},
  specialtyList: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, gap: 8},
  specialtyItem: {
    borderWidth: 1, borderColor: '#1a237e', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  specialtySelected: {backgroundColor: '#1a237e'},
  specialtyText: {color: '#1a237e', fontSize: 13, fontFamily: 'Cairo-Regular'},
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  row: {flexDirection: 'row', justifyContent: 'center', marginTop: 16},
  hintText: {color: '#666', fontSize: 13, fontFamily: 'Cairo-Regular'},
  linkText: {color: '#1a237e', fontSize: 13, fontFamily: 'Cairo-SemiBold'},
});
