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
import {useAuthStore} from '@store/auth.store';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

export default function LoginScreen({navigation}: Props) {
  const [phone, setPhone] = useState('+201222222201');
  const [password, setPassword] = useState('Test@12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {setTokens, setUser} = useAuthStore();

  const handleLogin = async () => {
    if (!phone || !password) {
      setError(ar.validation.required);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', {phone, password});
      const {accessToken, refreshToken, user} = res.data.data;
      if (user.role !== 'technician') {
        setError('هذا التطبيق مخصص للفنيين فقط');
        return;
      }
      setTokens(accessToken, refreshToken);
      setUser(user);
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
        <View style={styles.header}>
          <Text style={styles.logo}>🔧</Text>
          <Text style={styles.title}>فني برج العرب</Text>
          <Text style={styles.subtitle}>تطبيق الفنيين المحترفين</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>{ar.auth.phone}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+201xxxxxxxxx"
            keyboardType="phone-pad"
            textAlign="right"
          />

          <Text style={styles.label}>{ar.auth.password}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            textAlign="right"
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>{ar.auth.forgotPassword}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{ar.auth.login}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.hintText}>{ar.auth.noAccount}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}> {ar.auth.registerNow}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  scroll: {flexGrow: 1, justifyContent: 'center', padding: 24},
  header: {alignItems: 'center', marginBottom: 40},
  logo: {fontSize: 60, marginBottom: 12},
  title: {fontSize: 26, fontWeight: 'bold', color: '#1a237e', fontFamily: 'Cairo-Bold'},
  subtitle: {fontSize: 14, color: '#666', marginTop: 4, fontFamily: 'Cairo-Regular'},
  form: {backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8},
  error: {color: '#e53935', textAlign: 'center', marginBottom: 12, fontFamily: 'Cairo-Regular'},
  label: {fontSize: 14, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#fafafa',
    fontFamily: 'Cairo-Regular',
  },
  forgotBtn: {alignSelf: 'flex-start', marginBottom: 20},
  forgotText: {color: '#1a237e', fontSize: 13, fontFamily: 'Cairo-Regular'},
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  row: {flexDirection: 'row', justifyContent: 'center', marginTop: 16},
  hintText: {color: '#666', fontSize: 13, fontFamily: 'Cairo-Regular'},
  linkText: {color: '#1a237e', fontSize: 13, fontFamily: 'Cairo-SemiBold'},
});
