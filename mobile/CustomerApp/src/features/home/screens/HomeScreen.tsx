import React, { useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList, RefreshControl, StatusBar } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { apiClient } from "../../../api/client";
import { useAuthStore } from "../../../store/auth.store";
import { ar } from "../../../i18n/ar";

const P = "#2563eb";
const PD = "#1e40af";
const PL = "#eff6ff";
const EM = "#ef4444";

interface Category {
  id: string;
  name_ar: string;
  icon_url: string;
  color_hex: string;
}
interface Technician {
  id: string;
  full_name: string;
  rating_average: number;
  completed_jobs: number;
  availability: string;
}

function SkeletonBox({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  return <View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: "rgba(255,255,255,0.25)" }} />;
}

function CategoryCard({ item, onPress }: { item: Category; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.catCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.catIcon, { backgroundColor: item.color_hex + "22" }]}>
        <Text style={styles.catEmoji}>{item.icon_url}</Text>
      </View>
      <Text style={styles.catName} numberOfLines={2}>
        {item.name_ar}
      </Text>
    </TouchableOpacity>
  );
}

function TechCard({ item, onPress }: { item: Technician; onPress: () => void }) {
  const isOnline = item.availability === "online";
  return (
    <TouchableOpacity style={styles.techCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.techAvatarWrap}>
        <View style={styles.techAvatar}>
          <Text style={styles.techAvatarLetter}>{item.full_name.charAt(0)}</Text>
        </View>
        <View style={[styles.onlineBadge, { backgroundColor: isOnline ? "#22c55e" : "#d1d5db" }]} />
      </View>
      <Text style={styles.techName} numberOfLines={1}>
        {item.full_name}
      </Text>
      <View style={styles.techRatingRow}>
        <Text style={styles.techStar}>★</Text>
        <Text style={styles.techRating}>{parseFloat(String(item.rating_average)).toFixed(1)}</Text>
      </View>
      <Text style={styles.techJobs}>{item.completed_jobs} وظيفة</Text>
      <View style={[styles.techStatus, { backgroundColor: isOnline ? "#dcfce7" : "#f3f4f6" }]}>
        <Text style={[styles.techStatusText, { color: isOnline ? "#16a34a" : "#6b7280" }]}>{isOnline ? "متاح" : "مشغول"}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const {
    data: categories,
    isLoading: catLoading,
    refetch: refetchCats,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get("/services").then((r) => r.data.data as Category[]),
    staleTime: 1000 * 60 * 30,
  });

  const { data: technicians, refetch: refetchTechs } = useQuery({
    queryKey: ["nearby-technicians"],
    queryFn: () =>
      apiClient.get("/technicians", { params: { availability: "online", limit: 10 } }).then((r) => r.data.data?.rows ?? (r.data.data as Technician[])),
    staleTime: 1000 * 60,
  });

  const onRefresh = useCallback(() => {
    refetchCats();
    refetchTechs();
  }, []);
  const firstName = user?.full_name?.split(" ")[0] ?? "العميل";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PD} />
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={catLoading} onRefresh={onRefresh} tintColor="#fff" />}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => navigation.navigate("CreateRequest", { isEmergency: true })} activeOpacity={0.8}>
              <Text style={styles.emergencyText}>🚨 طارئ</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>مرحباً، {firstName} 👋</Text>
              <Text style={styles.subGreeting}>ماذا تحتاج اليوم؟</Text>
            </View>
          </View>

          {/* Search bar */}
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate("SearchScreen")} activeOpacity={0.9}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>{ar.home.searchPlaceholder}</Text>
          </TouchableOpacity>

          {/* Quick stats strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>14</Text>
              <Text style={styles.statLabel}>خدمة متاحة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(technicians as any[])?.length ?? 0}+</Text>
              <Text style={styles.statLabel}>فني قريب</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24/7</Text>
              <Text style={styles.statLabel}>دعم مستمر</Text>
            </View>
          </View>
        </View>

        {/* ── Categories ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <TouchableOpacity>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{ar.home.categories}</Text>
          </View>

          {catLoading ? (
            <View style={styles.catGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={[styles.catCard, { backgroundColor: "#f1f5f9" }]}>
                  <View style={[styles.catIcon, { backgroundColor: "#e2e8f0" }]} />
                  <View style={{ height: 8, width: 40, backgroundColor: "#e2e8f0", borderRadius: 4, marginTop: 6 }} />
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              numColumns={4}
              scrollEnabled={false}
              columnWrapperStyle={styles.catRow}
              renderItem={({ item }) => <CategoryCard item={item} onPress={() => navigation.navigate("CreateRequest", { categoryId: item.id })} />}
            />
          )}
        </View>

        {/* ── New Request Banner ── */}
        <TouchableOpacity style={styles.banner} onPress={() => navigation.navigate("CreateRequest")} activeOpacity={0.85}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>أضف طلباً جديداً</Text>
            <Text style={styles.bannerSub}>احصل على عروض أسعار من أفضل الفنيين</Text>
          </View>
          <Text style={styles.bannerIcon}>🛠</Text>
        </TouchableOpacity>

        {/* ── Technicians ── */}
        {(technicians as any[])?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View />
              <Text style={styles.sectionTitle}>{ar.home.nearbyTechnicians}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.techScroll}>
              {(technicians as Technician[]).map((t) => (
                <TechCard key={t.id} item={t} onPress={() => navigation.navigate("TechnicianProfile", { technicianId: t.id })} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },

  // Header
  header: { backgroundColor: P, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  greeting: { color: "#fff", fontSize: 19, fontFamily: "Cairo-Bold", textAlign: "right" },
  subGreeting: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Cairo-Regular", textAlign: "right" },
  emergencyBtn: { backgroundColor: EM, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 },
  emergencyText: { color: "#fff", fontSize: 13, fontFamily: "Cairo-Bold" },

  // Search
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: "#94a3b8", fontFamily: "Cairo-Regular", textAlign: "right" },

  // Stats
  statsStrip: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 17, fontFamily: "Cairo-Bold" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Cairo-Regular" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 4 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: "Cairo-Bold", color: "#0f172a" },
  seeAll: { fontSize: 13, color: P, fontFamily: "Cairo-Medium" },

  // Categories
  catGrid: { flexDirection: "row", flexWrap: "wrap" },
  catRow: { justifyContent: "space-between", marginBottom: 10 },
  catCard: {
    width: "23%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  catIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  catEmoji: { fontSize: 24 },
  catName: { fontSize: 11, textAlign: "center", color: "#334155", fontFamily: "Cairo-Medium", lineHeight: 16 },

  // Banner
  banner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: PD,
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: "#fff", fontSize: 16, fontFamily: "Cairo-Bold", marginBottom: 4 },
  bannerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Cairo-Regular" },
  bannerIcon: { fontSize: 44, marginLeft: 8 },

  // Technicians
  techScroll: { paddingBottom: 8, paddingRight: 4 },
  techCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginLeft: 12,
    width: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  techAvatarWrap: { position: "relative", marginBottom: 10 },
  techAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: PL, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: P },
  techAvatarLetter: { fontSize: 24, color: P, fontFamily: "Cairo-Bold" },
  onlineBadge: { position: "absolute", bottom: 1, left: 1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff" },
  techName: { fontSize: 12, fontFamily: "Cairo-SemiBold", color: "#0f172a", textAlign: "center", marginBottom: 4 },
  techRatingRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 2 },
  techStar: { color: "#f59e0b", fontSize: 13 },
  techRating: { fontSize: 12, color: "#475569", fontFamily: "Cairo-Regular" },
  techJobs: { fontSize: 10, color: "#94a3b8", fontFamily: "Cairo-Regular", marginBottom: 8 },
  techStatus: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  techStatusText: { fontSize: 10, fontFamily: "Cairo-SemiBold" },
});
