import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";
import dayjs from "dayjs";

type Props = { navigation: NativeStackNavigationProp<any> };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: ar.status.pending, color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  accepted: { label: ar.status.accepted, color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  in_progress: { label: ar.status.inProgress, color: "#6d28d9", bg: "#ede9fe", dot: "#8b5cf6" },
  completed: { label: ar.status.completed, color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  cancelled: { label: ar.status.cancelled, color: "#b91c1c", bg: "#fee2e2", dot: "#ef4444" },
  expired: { label: ar.status.expired, color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

const TABS = [
  { label: "الكل", key: "all" },
  { label: "نشط", key: "active" },
  { label: "مكتمل", key: "done" },
  { label: "ملغي", key: "cancelled" },
];

const STATUS_MAP: Record<string, string> = {
  active: "pending,accepted,in_progress",
  done: "completed",
  cancelled: "cancelled,expired",
};

const TYPE_ICON: Record<string, string> = {
  instant: "⚡",
  scheduled: "📅",
  emergency: "🚨",
};

export default function RequestsListScreen({ navigation }: Props) {
  const [tab, setTab] = useState("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-requests", tab],
    queryFn: async () => {
      const qs = tab !== "all" ? `?status=${STATUS_MAP[tab]}` : "";
      const res = await apiClient.get(`/requests/my${qs}`);
      return res.data.data as any[];
    },
  });

  const requests = data ?? [];

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" };
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("RequestDetail", { requestId: item.id })} activeOpacity={0.8}>
        <View style={[styles.cardAccent, { backgroundColor: cfg.dot }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <View style={[styles.badgeDot, { backgroundColor: cfg.dot }]} />
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.catText}>
              {TYPE_ICON[item.request_type] ?? "🔧"} {item.category_name}
            </Text>
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>{dayjs(item.created_at).format("DD/MM/YYYY")}</Text>
            {item.budget_from ? (
              <Text style={styles.budgetText}>
                {item.budget_from}–{item.budget_to} {ar.common.egp}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{ar.request.myRequests}</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate("NewRequest")}>
          <Text style={styles.newBtnText}>+ جديد</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)} activeOpacity={0.75}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={["#2563eb"]} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
              <Text style={styles.emptySub}>اضغط "جديد" لإنشاء طلب خدمة</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },

  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 20, fontFamily: "Cairo-Bold", color: "#0f172a" },
  newBtn: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: "#fff", fontSize: 13, fontFamily: "Cairo-Bold" },

  tabsWrap: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12 },
  tabs: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, color: "#64748b", fontFamily: "Cairo-Medium" },
  tabTextActive: { color: "#2563eb", fontFamily: "Cairo-Bold" },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  emptyContainer: { flex: 1, paddingHorizontal: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: "Cairo-SemiBold", color: "#0f172a", textAlign: "right", marginLeft: 8 },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: "Cairo-SemiBold" },
  cardMeta: { flexDirection: "row", marginBottom: 6 },
  catText: { fontSize: 12, color: "#64748b", fontFamily: "Cairo-Regular" },
  cardDesc: { fontSize: 13, color: "#475569", textAlign: "right", lineHeight: 20, fontFamily: "Cairo-Regular", marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetText: { fontSize: 13, color: "#15803d", fontFamily: "Cairo-Bold" },
  dateText: { fontSize: 11, color: "#94a3b8", fontFamily: "Cairo-Regular" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontFamily: "Cairo-Bold", color: "#334155", marginBottom: 6 },
  emptySub: { fontSize: 13, fontFamily: "Cairo-Regular", color: "#94a3b8" },
});
