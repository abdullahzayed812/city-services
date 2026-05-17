import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

export default function EditProfileScreen({navigation}: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({bio: '', experienceYears: '', specialty: ''});

  const {data: profile, isLoading} = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/technicians/me');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        experienceYears: String(profile.experience_years ?? ''),
        specialty: profile.specialty ?? '',
      });
    }
  }, [profile]);

  const update = useMutation({
    mutationFn: async () => {
      await apiClient.put('/technicians/me', {
        bio: form.bio,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        specialty: form.specialty,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['my-profile']});
      Alert.alert('تم', 'تم تحديث الملف الشخصي');
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{ar.auth.specialty}</Text>
      <TextInput style={styles.input} value={form.specialty} onChangeText={v => setForm(f => ({...f, specialty: v}))} textAlign="right" />

      <Text style={styles.label}>{ar.auth.experience} (سنوات)</Text>
      <TextInput style={styles.input} value={form.experienceYears} onChangeText={v => setForm(f => ({...f, experienceYears: v}))} keyboardType="number-pad" textAlign="right" />

      <Text style={styles.label}>{ar.profile.bio}</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.bio}
        onChangeText={v => setForm(f => ({...f, bio: v}))}
        multiline
        numberOfLines={4}
        textAlign="right"
        placeholder="اكتب نبذة عنك وعن خبرتك..."
      />

      <TouchableOpacity
        style={[styles.btn, update.isPending && styles.btnDisabled]}
        onPress={() => update.mutate()}
        disabled={update.isPending}>
        {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{ar.common.save}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  label: {fontSize: 13, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#fff'},
  textarea: {height: 100, textAlignVertical: 'top'},
  btn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8},
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
});
