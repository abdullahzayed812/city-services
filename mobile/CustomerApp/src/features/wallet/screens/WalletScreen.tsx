import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";
import dayjs from "dayjs";

const TX_TYPE: Record<string, { icon: string; label: string; color: string; isCredit: boolean }> = {
  earning: { icon: "⬇️", label: "أرباح", color: "#15803d", isCredit: true },
  deposit: { icon: "⬇️", label: "إيداع", color: "#15803d", isCredit: true },
  refund: { icon: "↩️", label: "استرداد", color: "#0369a1", isCredit: true },
  withdrawal: { icon: "⬆️", label: "سحب", color: "#b91c1c", isCredit: false },
  payment: { icon: "⬆️", label: "دفع", color: "#b45309", isCredit: false },
  commission: { icon: "📊", label: "عمولة", color: "#6d28d9", isCredit: false },
};

export default function WalletScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const [walletRes, txRes] = await Promise.all([apiClient.get("/wallets/me"), apiClient.get("/wallets/transactions")]);
      return { wallet: walletRes.data.data, transactions: txRes.data.data };
    },
  });

  const wallet = data?.wallet;
  const transactions: any[] = data?.transactions ?? [];

  const renderTx = ({ item }: { item: any }) => {
    const cfg = TX_TYPE[item.type] ?? { icon: "💳", label: item.type, color: "#475569", isCredit: false };
    return (
      <View style={styles.txCard}>
        <View style={styles.txLeft}>
          <Text style={[styles.txAmount, { color: cfg.color }]}>
            {cfg.isCredit ? "+" : "−"} {Math.abs(item.amount).toFixed(2)} {ar.common.egp}
          </Text>
          <Text style={styles.txDate}>{dayjs(item.created_at).format("DD/MM HH:mm")}</Text>
        </View>
        <View style={styles.txCenter}>
          <Text style={styles.txDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.txIconBox, { backgroundColor: cfg.isCredit ? "#dcfce7" : "#fee2e2" }]}>
          <Text style={styles.txIcon}>{cfg.icon}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{ar.wallet.balance}</Text>
        <Text style={styles.balanceAmount}>
          {parseFloat(wallet?.balance ?? 0).toFixed(2)}
          <Text style={styles.balanceCurrency}> {ar.common.egp}</Text>
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{parseFloat(wallet?.total_earned ?? 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>إجمالي المكتسب</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{parseFloat(wallet?.total_withdrawn ?? 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>إجمالي المسحوب</Text>
          </View>
        </View>
      </View>

      {/* Transactions */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{ar.wallet.transactions}</Text>
        <Text style={styles.listCount}>{transactions.length} معاملة</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTx}
        contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={["#2563eb"]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>لا توجد معاملات</Text>
            <Text style={styles.emptySub}>ستظهر هنا جميع عمليات محفظتك</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },

  balanceCard: {
    backgroundColor: "#2563eb",
    paddingTop: 52,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "Cairo-Regular", textAlign: "center", marginBottom: 6 },
  balanceAmount: { color: "#fff", fontSize: 40, fontFamily: "Cairo-Bold", textAlign: "center", marginBottom: 24 },
  balanceCurrency: { fontSize: 18, fontFamily: "Cairo-Regular" },

  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 18, fontFamily: "Cairo-Bold" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Cairo-Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)", marginVertical: 4 },

  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  listTitle: { fontSize: 16, fontFamily: "Cairo-Bold", color: "#0f172a" },
  listCount: { fontSize: 12, fontFamily: "Cairo-Regular", color: "#94a3b8" },

  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyContainer: { flex: 1 },

  txCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  txIcon: { fontSize: 18 },
  txCenter: { flex: 1 },
  txDesc: { fontSize: 13, color: "#334155", fontFamily: "Cairo-Regular", textAlign: "right", lineHeight: 20 },
  txLeft: { alignItems: "flex-start" },
  txAmount: { fontSize: 15, fontFamily: "Cairo-Bold", marginBottom: 2 },
  txDate: { fontSize: 11, color: "#94a3b8", fontFamily: "Cairo-Regular" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingTop: 60, alignItems: "center" },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontFamily: "Cairo-Bold", color: "#334155", marginBottom: 6 },
  emptySub: { fontSize: 13, fontFamily: "Cairo-Regular", color: "#94a3b8" },
});
