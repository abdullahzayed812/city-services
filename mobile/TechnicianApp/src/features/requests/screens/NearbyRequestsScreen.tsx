import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient} from '@api/client';
import {ar} from '@i18n/ar';
import dayjs from 'dayjs';

type Props = {navigation: NativeStackNavigationProp<any>};

interface Request {
  id: string;
  title: string;
  description: string;
  request_type: string;
  budget_from: number;
  budget_to: number;
  status: string;
  created_at: string;
  category_name: string;
  category_icon: string;
  customer_name: string;
}

const REQUEST_TYPE_MAP: Record<string, string> = {
  emergency: ar.requests.emergency,
  instant: ar.requests.standard,
  scheduled: ar.requests.scheduled,
};

async function fetchAllRequests(): Promise<Request[]> {
  const res = await apiClient.get('/requests/all');
  return res.data.data as Request[];
}

export default function NearbyRequestsScreen({navigation}: Props) {
  const {data, isLoading, isError, error, refetch, isRefetching} = useQuery({
    queryKey: ['all-requests'],
    queryFn: fetchAllRequests,
    refetchInterval: 30000,
    retry: 1,
  });

  const renderItem = useCallback(
    ({item}: {item: Request}) => (
      <TouchableOpacity
        style={[
          styles.card,
          item.request_type === 'emergency' && styles.emergencyCard,
        ]}
        onPress={() => navigation.navigate('RequestDetail', {requestId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, item.request_type === 'emergency' && styles.emergencyBadge]}>
            <Text style={styles.badgeText}>
              {REQUEST_TYPE_MAP[item.request_type] ?? item.request_type}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.icon}>{item.category_icon}</Text>
            <Text style={styles.category}>{item.category_name}</Text>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{dayjs(item.created_at).fromNow()}</Text>
          {item.budget_from ? (
            <Text style={styles.budget}>
              {item.budget_from} - {item.budget_to} {ar.common.egp}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>
          {(error as Error)?.message ?? ar.common.error}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>{ar.common.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{ar.requests.title}</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{ar.common.noData}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    padding: 16,
    fontFamily: 'Cairo-Bold',
    textAlign: 'right',
  },
  list: {paddingHorizontal: 16, paddingBottom: 20},
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  emergencyCard: {borderRightWidth: 4, borderRightColor: '#e53935'},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 6},
  icon: {fontSize: 20},
  category: {fontSize: 13, color: '#555', fontFamily: 'Cairo-Regular'},
  badge: {
    backgroundColor: '#e8eaf6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  emergencyBadge: {backgroundColor: '#ffebee'},
  badgeText: {fontSize: 11, color: '#1a237e', fontFamily: 'Cairo-SemiBold'},
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
    fontFamily: 'Cairo-SemiBold',
    textAlign: 'right',
  },
  desc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budget: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: 'bold',
    fontFamily: 'Cairo-SemiBold',
  },
  time: {fontSize: 11, color: '#aaa', fontFamily: 'Cairo-Regular'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyText: {fontSize: 15, color: '#999', fontFamily: 'Cairo-Regular'},
  errorIcon: {fontSize: 48, marginBottom: 16},
  errorText: {
    fontSize: 14,
    color: '#c62828',
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {color: '#fff', fontSize: 14, fontFamily: 'Cairo-SemiBold'},
});
