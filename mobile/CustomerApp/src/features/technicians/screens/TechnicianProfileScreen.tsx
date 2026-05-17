import React from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiClient, mediaUrl } from "@api/client";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> };

export default function TechnicianProfileScreen({ route }: Props) {
  const { technicianId } = route.params as { technicianId: number };

  const { data: tech, isLoading } = useQuery({
    queryKey: ["technician", technicianId],
    queryFn: async () => {
      const res = await apiClient.get(`/technicians/${technicianId}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00695c" />
      </View>
    );
  }

  if (!tech) {
    return (
      <View style={styles.center}>
        <Text>{ar.common.noData}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {tech.avatar_url ? (
          <Image source={{ uri: mediaUrl(tech.avatar_url) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{tech.full_name?.[0] ?? "ف"}</Text>
          </View>
        )}
        <Text style={styles.name}>{tech.full_name}</Text>
        <Text style={styles.specialty}>{tech.specialty}</Text>
        <View style={styles.onlineDot}>
          <View style={[styles.dot, { backgroundColor: tech.is_online ? "#4caf50" : "#9e9e9e" }]} />
          <Text style={styles.onlineText}>{tech.is_online ? "متاح الآن" : "غير متاح"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBox label={ar.common.stars} value={`${tech.rating_average ?? 0} ★`} />
        <StatBox label="وظائف" value={String(tech.completed_jobs ?? 0)} />
        <StatBox label="خبرة" value={`${tech.experience_years ?? 0} سنة`} />
      </View>

      {tech.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نبذة</Text>
          <Text style={styles.bio}>{tech.bio}</Text>
        </View>
      )}

      {tech.services?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الخدمات</Text>
          <View style={styles.servicesRow}>
            {tech.services.map((s: any) => (
              <View key={s.id} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>
                  {s.icon} {s.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {tech.portfolio?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معرض الأعمال</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tech.portfolio.map((item: any) => (
              <Image key={item.id} source={{ uri: mediaUrl(item.image_url) }} style={styles.portfolioImg} />
            ))}
          </ScrollView>
        </View>
      )}

      {tech.reviews?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التقييمات</Text>
          {tech.reviews.slice(0, 5).map((r: any) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{r.customer_name}</Text>
                <Text style={styles.reviewRating}>{"★".repeat(r.rating)}</Text>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#00695c", alignItems: "center", padding: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#fff", marginBottom: 10 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 36, color: "#fff", fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff", fontFamily: "Cairo-Bold", marginBottom: 4 },
  specialty: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Cairo-Regular", marginBottom: 10 },
  onlineDot: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  onlineText: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "Cairo-Regular" },
  statsRow: { flexDirection: "row", margin: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center", elevation: 2 },
  statValue: { fontSize: 17, fontWeight: "bold", color: "#00695c", fontFamily: "Cairo-Bold" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4, fontFamily: "Cairo-Regular" },
  section: { backgroundColor: "#fff", borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#333", textAlign: "right", marginBottom: 10, fontFamily: "Cairo-Bold" },
  bio: { fontSize: 13, color: "#555", textAlign: "right", lineHeight: 22, fontFamily: "Cairo-Regular" },
  servicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: { backgroundColor: "#e0f2f1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  serviceChipText: { fontSize: 12, color: "#00695c", fontFamily: "Cairo-Regular" },
  portfolioImg: { width: 100, height: 100, borderRadius: 10, marginLeft: 8 },
  reviewCard: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0", paddingBottom: 10, marginBottom: 10 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  reviewName: { fontSize: 13, fontWeight: "bold", color: "#333", fontFamily: "Cairo-SemiBold" },
  reviewRating: { color: "#f57c00", fontSize: 14 },
  reviewComment: { fontSize: 13, color: "#666", textAlign: "right", fontFamily: "Cairo-Regular" },
});
