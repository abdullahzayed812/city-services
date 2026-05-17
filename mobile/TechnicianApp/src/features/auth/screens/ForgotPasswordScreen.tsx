import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

export default function ForgotPasswordScreen({navigation}: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!phone) {setError(ar.validation.required); return;}
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/request-otp', {phone, purpose: 'reset_password'});
      navigation.navigate('OTP', {phone, purpose: 'reset_password'});
    } catch (err: any) {
      setError(err.response?.data?.message ?? ar.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{ar.auth.forgotPassword}</Text>
      <Text style={styles.subtitle}>أدخل رقم هاتفك لاستقبال رمز التحقق</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>{ar.auth.phone}</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSend} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>إرسال رمز التحقق</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 24, justifyContent: 'center'},
  title: {fontSize: 22, fontWeight: 'bold', color: '#1a237e', textAlign: 'center', marginBottom: 8, fontFamily: 'Cairo-Bold'},
  subtitle: {fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32, fontFamily: 'Cairo-Regular'},
  error: {color: '#e53935', textAlign: 'center', marginBottom: 12, fontFamily: 'Cairo-Regular'},
  label: {fontSize: 13, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 24, backgroundColor: '#fff'},
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
});
