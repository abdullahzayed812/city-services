import React from 'react';
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

export default function WalletScreen({navigation}: Props) {
  const {data, isLoading, refetch, isRefetching} = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const [walletRes, txRes] = await Promise.all([
        apiClient.get('/wallets/me'),
        apiClient.get('/wallets/transactions'),
      ]);
      return {wallet: walletRes.data.data, transactions: txRes.data.data};
    },
  });

  const renderTx = ({item}: {item: any}) => (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <Text style={[styles.txAmount, item.type === 'credit' ? styles.credit : styles.debit]}>
          {item.type === 'credit' ? '+' : '-'}{item.amount} {ar.common.egp}
        </Text>
        <Text style={styles.txDate}>{dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txDesc}>{item.description}</Text>
        <View style={[styles.txBadge, item.status === 'completed' ? styles.completedBadge : styles.pendingBadge]}>
          <Text style={styles.txBadgeText}>{item.status === 'completed' ? 'مكتمل' : 'معلق'}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{ar.wallet.balance}</Text>
        <Text style={styles.balanceAmount}>{data?.wallet?.balance ?? 0} {ar.common.egp}</Text>
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => navigation.navigate('Withdraw')}>
          <Text style={styles.withdrawBtnText}>{ar.wallet.withdraw}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{ar.wallet.transactions}</Text>

      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={item => String(item.id)}
        renderItem={renderTx}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>{ar.common.noData}</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  balanceCard: {
    backgroundColor: '#1a237e',
    padding: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
  },
  balanceLabel: {color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8, fontFamily: 'Cairo-Regular'},
  balanceAmount: {color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 20, fontFamily: 'Cairo-Bold'},
  withdrawBtn: {backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 32, paddingVertical: 10},
  withdrawBtnText: {color: '#1a237e', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  sectionTitle: {fontSize: 16, fontWeight: 'bold', color: '#333', padding: 16, fontFamily: 'Cairo-Bold'},
  list: {paddingHorizontal: 16, paddingBottom: 20},
  txRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    elevation: 1,
  },
  txLeft: {alignItems: 'flex-end'},
  txRight: {alignItems: 'flex-start', flex: 1, paddingLeft: 12},
  txAmount: {fontSize: 16, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
  credit: {color: '#2e7d32'},
  debit: {color: '#c62828'},
  txDate: {fontSize: 11, color: '#aaa', marginTop: 2, fontFamily: 'Cairo-Regular'},
  txDesc: {fontSize: 13, color: '#333', textAlign: 'left', marginBottom: 4, fontFamily: 'Cairo-Regular'},
  txBadge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  completedBadge: {backgroundColor: '#e8f5e9'},
  pendingBadge: {backgroundColor: '#fff8e1'},
  txBadgeText: {fontSize: 10, color: '#333', fontFamily: 'Cairo-Regular'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60},
  emptyText: {fontSize: 15, color: '#999', fontFamily: 'Cairo-Regular'},
});
