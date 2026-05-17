import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";
import dayjs from "dayjs";

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: ar.status.pending, color: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  accepted: { label: ar.status.accepted, color: "#1d4ed8", bg: "#dbeafe", dot: "#3b82f6" },
  in_progress: { label: ar.status.inProgress, color: "#6d28d9", bg: "#ede9fe", dot: "#8b5cf6" },
  completed: { label: ar.status.completed, color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  cancelled: { label: ar.status.cancelled, color: "#b91c1c", bg: "#fee2e2", dot: "#ef4444" },
  expired: { label: ar.status.expired, color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

const TYPE_ICON: Record<string, string> = { instant: "⚡", scheduled: "📅", emergency: "🚨" };

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <View style={styles.infoLabelWrap}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ProposalCard({ p, onPress }: { p: any; onPress: () => void }) {
  return (
    <View style={styles.propCard}>
      <View style={styles.propHeader}>
        <Text style={styles.propPrice}>
          {p.proposed_price} {ar.common.egp}
        </Text>
        <View style={styles.propNameWrap}>
          <View style={styles.propAvatar}>
            <Text style={styles.propAvatarText}>{p.technician_name?.charAt(0)}</Text>
          </View>
          <Text style={styles.propName}>{p.technician_name}</Text>
        </View>
      </View>
      {p.message ? <Text style={styles.propNote}>{p.message}</Text> : null}
      <View style={styles.propMeta}>
        {p.estimated_duration_minutes ? <Text style={styles.propMetaItem}>🕐 {p.estimated_duration_minutes} دقيقة</Text> : null}
        {p.rating_average ? <Text style={styles.propMetaItem}>⭐ {parseFloat(p.rating_average).toFixed(1)}</Text> : null}
      </View>
      <TouchableOpacity style={styles.acceptBtn} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.acceptBtnText}>عرض التفاصيل وقبول العرض</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RequestDetailScreen({ navigation, route }: Props) {
  const { requestId } = route.params as { requestId: string };

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", requestId],
    queryFn: () => apiClient.get(`/requests/${requestId}`).then((r) => r.data.data),
  });

  const { data: proposals } = useQuery({
    queryKey: ["proposals", requestId],
    queryFn: () => apiClient.get(`/proposals?requestId=${requestId}`).then((r) => r.data.data),
    enabled: !!request && request.status === "pending",
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>{ar.common.noData}</Text>
      </View>
    );
  }

  const cfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.expired;
  const canChat = request.status === "accepted" || request.status === "in_progress";

  return (
    <View style={styles.root}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Main card */}
        <View style={styles.card}>
          <View style={styles.cardTitle}>
            <Text style={styles.typeIcon}>{TYPE_ICON[request.request_type] ?? "🔧"}</Text>
            <Text style={styles.title}>{request.title}</Text>
          </View>
          {request.category_name && <Text style={styles.category}>{request.category_name}</Text>}
          <Text style={styles.desc}>{request.description}</Text>
        </View>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>تفاصيل الطلب</Text>
          <InfoRow icon="📍" label="الموقع" value={request.address ?? "غير محدد"} />
          <InfoRow icon="📅" label="تاريخ الطلب" value={dayjs(request.created_at).format("DD/MM/YYYY HH:mm")} />
          {request.budget_from && <InfoRow icon="💰" label="الميزانية" value={`${request.budget_from} – ${request.budget_to} ${ar.common.egp}`} />}
          {request.final_price && <InfoRow icon="✅" label="السعر النهائي" value={`${request.final_price} ${ar.common.egp}`} />}
          {request.payment_method && <InfoRow icon="💳" label="طريقة الدفع" value={request.payment_method} />}
        </View>

        {/* Action buttons */}
        {canChat && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => navigation.navigate("Chat", { requestId: request.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>💬</Text>
              <Text style={styles.actionBtnTextPrimary}>محادثة الفني</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => navigation.navigate("Tracking", { requestId: request.id })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>📍</Text>
              <Text style={styles.actionBtnTextSecondary}>تتبع الفني</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Proposals */}
        {request.status === "pending" && (proposals as any[])?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عروض الأسعار ({(proposals as any[]).length})</Text>
            {(proposals as any[]).map((p: any) => (
              <ProposalCard key={p.id} p={p} onPress={() => navigation.navigate("Proposals", { requestId: request.id })} />
            ))}
          </View>
        )}

        {request.status === "pending" && !(proposals as any[])?.length && (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingTitle}>في انتظار عروض الأسعار</Text>
            <Text style={styles.waitingSub}>سيتواصل معك الفنيون القريبون قريباً</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  noData: { fontSize: 15, color: "#94a3b8", fontFamily: "Cairo-Regular" },

  statusBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontFamily: "Cairo-Bold" },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  typeIcon: { fontSize: 22 },
  title: { flex: 1, fontSize: 17, fontFamily: "Cairo-Bold", color: "#0f172a", textAlign: "right" },
  category: { fontSize: 13, color: "#64748b", fontFamily: "Cairo-Regular", textAlign: "right", marginBottom: 10 },
  desc: { fontSize: 14, color: "#475569", lineHeight: 24, textAlign: "right", fontFamily: "Cairo-Regular" },

  cardSectionTitle: { fontSize: 14, fontFamily: "Cairo-Bold", color: "#0f172a", textAlign: "right", marginBottom: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoIcon: { fontSize: 14 },
  infoLabel: { fontSize: 13, color: "#94a3b8", fontFamily: "Cairo-Regular" },
  infoValue: { fontSize: 13, color: "#334155", fontFamily: "Cairo-SemiBold", flex: 1, textAlign: "right", marginRight: 12 },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  actionBtnPrimary: { backgroundColor: "#2563eb" },
  actionBtnSecondary: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#2563eb" },
  actionBtnIcon: { fontSize: 18 },
  actionBtnTextPrimary: { color: "#fff", fontSize: 14, fontFamily: "Cairo-Bold" },
  actionBtnTextSecondary: { color: "#2563eb", fontSize: 14, fontFamily: "Cairo-Bold" },

  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Cairo-Bold", color: "#0f172a", textAlign: "right", marginBottom: 10 },

  propCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  propHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  propNameWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  propAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  propAvatarText: { fontSize: 15, color: "#2563eb", fontFamily: "Cairo-Bold" },
  propName: { fontSize: 14, fontFamily: "Cairo-SemiBold", color: "#0f172a" },
  propPrice: { fontSize: 18, fontFamily: "Cairo-Bold", color: "#15803d" },
  propNote: { fontSize: 13, color: "#64748b", textAlign: "right", lineHeight: 20, fontFamily: "Cairo-Regular", marginBottom: 10 },
  propMeta: { flexDirection: "row", gap: 14, marginBottom: 12 },
  propMetaItem: { fontSize: 12, color: "#64748b", fontFamily: "Cairo-Regular" },
  acceptBtn: { backgroundColor: "#eff6ff", borderRadius: 10, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: "#bfdbfe" },
  acceptBtnText: { color: "#2563eb", fontSize: 13, fontFamily: "Cairo-Bold" },

  waitingCard: { backgroundColor: "#fff", borderRadius: 18, padding: 28, alignItems: "center", marginBottom: 12 },
  waitingIcon: { fontSize: 44, marginBottom: 12 },
  waitingTitle: { fontSize: 16, fontFamily: "Cairo-Bold", color: "#334155", marginBottom: 6 },
  waitingSub: { fontSize: 13, fontFamily: "Cairo-Regular", color: "#94a3b8", textAlign: "center" },
});
