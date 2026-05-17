import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";
import dayjs from "dayjs";

export default function TransactionsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await apiClient.get("/wallets/transactions");
      return res.data.data;
    },
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.amount, item.type === "credit" ? styles.credit : styles.debit]}>
          {item.type === "credit" ? "+" : "-"}
          {item.amount} {ar.common.egp}
        </Text>
        <Text style={styles.date}>{dayjs(item.created_at).format("DD/MM/YYYY HH:mm")}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={[styles.status, { color: item.status === "completed" ? "#2e7d32" : "#f57c00" }]}>{item.status === "completed" ? "مكتمل" : "معلق"}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00695c" />
      </View>
    );
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>{ar.common.noData}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  list: { padding: 16, paddingBottom: 20 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  left: { alignItems: "flex-end" },
  right: { flex: 1, paddingRight: 12 },
  amount: { fontSize: 15, fontWeight: "bold", fontFamily: "Cairo-Bold" },
  credit: { color: "#2e7d32" },
  debit: { color: "#c62828" },
  date: { fontSize: 11, color: "#aaa", marginTop: 2, fontFamily: "Cairo-Regular" },
  desc: { fontSize: 13, color: "#333", textAlign: "right", fontFamily: "Cairo-Regular" },
  status: { fontSize: 11, textAlign: "right", marginTop: 2, fontFamily: "Cairo-SemiBold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  empty: { fontSize: 15, color: "#999", fontFamily: "Cairo-Regular" },
});
