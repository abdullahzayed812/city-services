import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import DocumentPicker from 'react-native-document-picker';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';

const DOCUMENT_TYPES = [
  {key: 'national_id', label: ar.profile.nationalId},
  {key: 'criminal_record', label: ar.profile.criminalRecord},
  {key: 'certifications', label: ar.profile.certifications},
];

export default function DocumentsScreen() {
  const qc = useQueryClient();

  const {data: docs, isLoading} = useQuery({
    queryKey: ['my-documents'],
    queryFn: async () => {
      const res = await apiClient.get('/technicians/me/documents');
      return res.data.data as Array<{type: string; url: string; status: string}>;
    },
  });


  const upload = useMutation({
    mutationFn: async ({type, file}: {type: string; file: any}) => {
      const form = new FormData();
      form.append('type', type);
      form.append('document', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      await apiClient.post('/technicians/me/documents', form, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['my-documents']});
      Alert.alert('تم', 'تم رفع المستند بنجاح');
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const handleUpload = async (type: string) => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      upload.mutate({type, file: result});
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) Alert.alert('خطأ', 'فشل اختيار الملف');
    }
  };

  const getDocStatus = (type: string) => docs?.find(d => d.type === type);

  const STATUS_COLOR: Record<string, string> = {
    pending: '#f57c00',
    approved: '#2e7d32',
    rejected: '#c62828',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>ارفع مستنداتك لاعتماد حسابك والبدء في تلقي الطلبات</Text>
      {DOCUMENT_TYPES.map(doc => {
        const existing = getDocStatus(doc.key);
        return (
          <View key={doc.key} style={styles.docCard}>
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              {existing ? (
                <View style={[styles.statusBadge, {backgroundColor: STATUS_COLOR[existing.status] + '22'}]}>
                  <Text style={[styles.statusText, {color: STATUS_COLOR[existing.status]}]}>
                    {existing.status === 'approved' ? 'معتمد' : existing.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.notUploaded}>لم يُرفع بعد</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.uploadBtn, upload.isPending && styles.btnDisabled]}
              onPress={() => handleUpload(doc.key)}
              disabled={upload.isPending}>
              {upload.isPending ? (
                <ActivityIndicator size="small" color="#1a237e" />
              ) : (
                <Text style={styles.uploadBtnText}>{existing ? 'تحديث' : ar.profile.uploadDocument}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  hint: {fontSize: 13, color: '#666', marginBottom: 16, fontFamily: 'Cairo-Regular'},
  docCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2,
  },
  docInfo: {flex: 1, marginLeft: 12},
  docLabel: {fontSize: 14, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  statusBadge: {alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20},
  statusText: {fontSize: 11, fontFamily: 'Cairo-SemiBold'},
  notUploaded: {fontSize: 11, color: '#aaa', fontFamily: 'Cairo-Regular'},
  uploadBtn: {backgroundColor: '#e8eaf6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20},
  btnDisabled: {opacity: 0.5},
  uploadBtnText: {fontSize: 13, color: '#1a237e', fontFamily: 'Cairo-SemiBold'},
});
