import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {apiClient, mediaUrl} from '@api/client';
import {ar} from '@i18n/ar';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function RequestDetailScreen({navigation, route}: Props) {
  const {requestId} = route.params as {requestId: number};
  const qc = useQueryClient();
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);

  const {data: request, isLoading} = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      const res = await apiClient.get(`/requests/${requestId}`);
      return res.data.data;
    },
  });

  const sendProposal = useMutation({
    mutationFn: async () => {
      await apiClient.post('/proposals', {
        request_id: requestId,
        proposed_price: parseFloat(price),
        message: note,
      });
    },
    onSuccess: () => {
      Alert.alert('تم', 'تم إرسال عرض السعر بنجاح');
      qc.invalidateQueries({queryKey: ['all-requests']});
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  if (!request) {
    return <View style={styles.center}><Text>{ar.common.noData}</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{request.category_icon}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.categoryName}>{request.category_name}</Text>
            <View style={[styles.badge, request.type === 'emergency' && styles.emergencyBadge]}>
              <Text style={styles.badgeText}>
                {request.type === 'emergency' ? ar.requests.emergency : request.type === 'scheduled' ? ar.requests.scheduled : ar.requests.standard}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{request.title}</Text>
        <Text style={styles.desc}>{request.description}</Text>

        <View style={styles.divider} />

        <InfoRow label={ar.requests.budget} value={`${request.budget_min} - ${request.budget_max} ${ar.common.egp}`} />
        <InfoRow label={ar.requests.location} value={request.address ?? 'غير محدد'} />
        <InfoRow label="العميل" value={request.customer_name} />
        <InfoRow label={ar.requests.distance} value={`${request.distance_km?.toFixed(1)} ${ar.common.km}`} />

        {request.images?.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>{ar.requests.images}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {request.images.map((img: string, i: number) => (
                <Image key={i} source={{uri: mediaUrl(img)}} style={styles.image} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {!showProposalForm ? (
        <TouchableOpacity style={styles.proposalBtn} onPress={() => setShowProposalForm(true)}>
          <Text style={styles.proposalBtnText}>{ar.requests.sendProposal}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.proposalForm}>
          <Text style={styles.formTitle}>{ar.requests.sendProposal}</Text>

          <Text style={styles.label}>{ar.requests.proposalPrice} ({ar.common.egp})</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            textAlign="right"
            placeholder="0.00"
          />

          <Text style={styles.label}>{ar.requests.proposalNote}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlign="right"
            placeholder="أضف ملاحظة للعميل..."
          />

          <TouchableOpacity
            style={[styles.sendBtn, sendProposal.isPending && styles.btnDisabled]}
            onPress={() => sendProposal.mutate()}
            disabled={sendProposal.isPending}>
            {sendProposal.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>{ar.requests.sendProposal}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowProposalForm(false)}>
            <Text style={styles.cancelBtnText}>{ar.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}:</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2},
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12},
  icon: {fontSize: 32},
  headerInfo: {flex: 1, alignItems: 'flex-end'},
  categoryName: {fontSize: 14, color: '#555', fontFamily: 'Cairo-Regular'},
  badge: {backgroundColor: '#e8eaf6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 4},
  emergencyBadge: {backgroundColor: '#ffebee'},
  badgeText: {fontSize: 11, color: '#1a237e', fontFamily: 'Cairo-SemiBold'},
  title: {fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 8, fontFamily: 'Cairo-Bold'},
  desc: {fontSize: 14, color: '#555', lineHeight: 22, fontFamily: 'Cairo-Regular'},
  divider: {height: 1, backgroundColor: '#eee', marginVertical: 16},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10},
  infoLabel: {fontSize: 13, color: '#888', fontFamily: 'Cairo-Regular'},
  infoValue: {fontSize: 13, color: '#333', fontFamily: 'Cairo-SemiBold', flex: 1, marginRight: 8},
  imagesSection: {marginTop: 12},
  sectionTitle: {fontSize: 14, color: '#333', marginBottom: 8, fontFamily: 'Cairo-SemiBold'},
  image: {width: 100, height: 100, borderRadius: 8, marginLeft: 8},
  proposalBtn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  proposalBtnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  proposalForm: {backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2},
  formTitle: {fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 16, fontFamily: 'Cairo-Bold'},
  label: {fontSize: 13, color: '#333', marginBottom: 6, fontFamily: 'Cairo-SemiBold'},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#fafafa'},
  textarea: {height: 80, textAlignVertical: 'top'},
  sendBtn: {backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10},
  btnDisabled: {opacity: 0.6},
  sendBtnText: {color: '#fff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  cancelBtn: {alignItems: 'center', paddingVertical: 10},
  cancelBtnText: {color: '#888', fontSize: 14, fontFamily: 'Cairo-Regular'},
});
