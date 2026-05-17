import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';
import dayjs from 'dayjs';

type Props = {navigation: NativeStackNavigationProp<any>};

const TABS = [
  {key: 'active', label: ar.jobs.active},
  {key: 'completed', label: ar.jobs.completed},
  {key: 'cancelled', label: ar.jobs.cancelled},
];

const STATUS_COLORS: Record<string, string> = {
  accepted: '#1565c0',
  in_progress: '#f57c00',
  completed: '#2e7d32',
  cancelled: '#c62828',
};

export default function MyJobsScreen({navigation}: Props) {
  const [tab, setTab] = useState('active');
  const qc = useQueryClient();

  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['my-jobs', tab],
    queryFn: async () => {
      const statusMap: Record<string, string> = {
        active: 'accepted,in_progress',
        completed: 'completed',
        cancelled: 'cancelled,expired',
      };
      const res = await apiClient.get(`/requests/my-jobs?status=${statusMap[tab]}`);
      return res.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({id, status}: {id: number; status: string}) => {
      await apiClient.patch(`/requests/${id}/status`, {status});
    },
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['my-jobs']});
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err.response?.data?.message ?? ar.common.error);
    },
  });

  const handleStatusChange = (id: number, current: string) => {
    if (current === 'accepted') {
      Alert.alert('تأكيد', 'هل تريد بدء العمل الآن؟', [
        {text: ar.common.cancel, style: 'cancel'},
        {text: ar.jobs.startJob, onPress: () => updateStatus.mutate({id, status: 'in_progress'})},
      ]);
    } else if (current === 'in_progress') {
      Alert.alert('تأكيد', 'هل أتممت العمل بنجاح؟', [
        {text: ar.common.cancel, style: 'cancel'},
        {text: ar.jobs.completeJob, onPress: () => updateStatus.mutate({id, status: 'completed'})},
      ]);
    }
  };

  const renderItem = ({item}: {item: any}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, {backgroundColor: STATUS_COLORS[item.status] ?? '#888'}]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.customerName}>العميل: {item.customer_name}</Text>
      <Text style={styles.category}>{item.category_icon} {item.category_name}</Text>
      <Text style={styles.price}>{item.accepted_price} {ar.common.egp}</Text>
      <Text style={styles.date}>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</Text>

      {(item.status === 'accepted' || item.status === 'in_progress') && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Chat', {requestId: item.id, customerName: item.customer_name})}>
            <Text style={styles.actionBtnText}>💬 محادثة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={() => handleStatusChange(item.id, item.status)}>
            <Text style={[styles.actionBtnText, {color: '#fff'}]}>
              {item.status === 'accepted' ? ar.jobs.startJob : ar.jobs.completeJob}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{ar.jobs.title}</Text>
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{ar.common.noData}</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {fontSize: 20, fontWeight: 'bold', color: '#1a237e', padding: 16, fontFamily: 'Cairo-Bold'},
  tabs: {flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8},
  tab: {flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e8eaf6', alignItems: 'center'},
  tabActive: {backgroundColor: '#1a237e'},
  tabText: {fontSize: 13, color: '#1a237e', fontFamily: 'Cairo-SemiBold'},
  tabTextActive: {color: '#fff'},
  list: {paddingHorizontal: 16, paddingBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  cardTitle: {fontSize: 15, fontWeight: 'bold', color: '#222', flex: 1, fontFamily: 'Cairo-SemiBold'},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  statusText: {fontSize: 11, color: '#fff', fontFamily: 'Cairo-SemiBold'},
  customerName: {fontSize: 13, color: '#555', marginBottom: 4, fontFamily: 'Cairo-Regular'},
  category: {fontSize: 13, color: '#888', marginBottom: 4, fontFamily: 'Cairo-Regular'},
  price: {fontSize: 15, color: '#2e7d32', fontWeight: 'bold', marginBottom: 4, fontFamily: 'Cairo-Bold'},
  date: {fontSize: 11, color: '#aaa', marginBottom: 12, fontFamily: 'Cairo-Regular'},
  actions: {flexDirection: 'row', gap: 10},
  actionBtn: {flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1a237e', alignItems: 'center'},
  primaryBtn: {backgroundColor: '#1a237e'},
  actionBtnText: {fontSize: 13, color: '#1a237e', fontFamily: 'Cairo-SemiBold'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60},
  emptyText: {fontSize: 15, color: '#999', fontFamily: 'Cairo-Regular'},
});
