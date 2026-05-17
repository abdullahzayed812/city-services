import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {apiClient} from '@api/client';
import {useAuthStore} from '@store/auth.store';
import {ar} from '@i18n/ar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function OtpScreen({navigation, route}: Props) {
  const {phone, purpose} = route.params as {phone: string; purpose: string};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<TextInput[]>([]);
  const {setTokens, setUser} = useAuthStore();

  const handleChange = (val: string, idx: number) => {
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError(ar.validation.invalidOtp);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/verify-otp', {phone, code, purpose});
      if (purpose === 'register') {
        const {accessToken, refreshToken, user} = res.data.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } else {
        navigation.navigate('ResetPassword', {phone, code});
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? ar.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post('/auth/request-otp', {phone, purpose});
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{ar.auth.otpSent}</Text>
      <Text style={styles.subtitle}>تم إرسال رمز التحقق إلى {phone}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={r => {if (r) inputs.current[i] = r;}}
            style={styles.otpInput}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{ar.auth.verify}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
        <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 24},
  title: {fontSize: 22, fontWeight: 'bold', color: '#1a237e', marginBottom: 8, fontFamily: 'Cairo-Bold'},
  subtitle: {fontSize: 14, color: '#666', marginBottom: 32, textAlign: 'center', fontFamily: 'Cairo-Regular'},
  error: {color: '#e53935', marginBottom: 16, fontFamily: 'Cairo-Regular'},
  otpRow: {flexDirection: 'row', gap: 10, marginBottom: 32},
  otpInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: '#1a237e',
    borderRadius: 10, fontSize: 22, fontWeight: 'bold', backgroundColor: '#fff',
  },
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 60, alignItems: 'center'},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  resendBtn: {marginTop: 20},
  resendText: {color: '#1a237e', fontSize: 14, fontFamily: 'Cairo-Regular'},
});
