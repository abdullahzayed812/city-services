import React from "react";
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> };

export default function ServiceDetailScreen({ navigation, route }: Props) {
  const { categoryId } = route.params as { categoryId: number };

  const { data, isLoading } = useQuery({
    queryKey: ["category-technicians", categoryId],
    queryFn: async () => {
      const [catRes, techRes] = await Promise.all([
        apiClient.get(`/categories/${categoryId}`),
        apiClient.get(`/technicians?categoryId=${categoryId}&verified=true`),
      ]);
      return { category: catRes.data.data, technicians: techRes.data.data };
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00695c" />
      </View>
    );
  }

  const { category, technicians } = data ?? {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryIcon}>{category?.icon}</Text>
        <Text style={styles.categoryName}>{category?.name}</Text>
        <Text style={styles.categoryDesc}>{category?.description}</Text>
      </View>

      <TouchableOpacity style={styles.requestBtn} onPress={() => navigation.navigate("CreateRequest", { categoryId })}>
        <Text style={styles.requestBtnText}>+ إنشاء طلب جديد</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>الفنيون المتاحون ({technicians?.length ?? 0})</Text>

      {(technicians ?? []).map((tech: any) => (
        <TouchableOpacity key={tech.id} style={styles.techCard} onPress={() => navigation.navigate("TechnicianProfile", { technicianId: tech.id })}>
          <View style={styles.techLeft}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{tech.full_name?.[0] ?? "ف"}</Text>
            </View>
            {tech.is_online && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.techInfo}>
            <Text style={styles.techName}>{tech.full_name}</Text>
            <Text style={styles.techSpecialty}>{tech.specialty}</Text>
            <Text style={styles.techMeta}>
              ⭐ {tech.rating_average} · {tech.completed_jobs} وظيفة · {tech.experience_years} سنة خبرة
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  categoryHeader: {
    backgroundColor: "#00695c",
    alignItems: "center",
    padding: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  categoryIcon: { fontSize: 48, marginBottom: 8 },
  categoryName: { fontSize: 22, fontWeight: "bold", color: "#fff", fontFamily: "Cairo-Bold", marginBottom: 4 },
  categoryDesc: { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", fontFamily: "Cairo-Regular" },
  requestBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#00695c",
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  requestBtnText: { color: "#00695c", fontSize: 14, fontWeight: "bold", fontFamily: "Cairo-Bold" },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#333", paddingHorizontal: 16, marginBottom: 12, textAlign: "right", fontFamily: "Cairo-Bold" },
  techCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    gap: 12,
  },
  techLeft: { position: "relative" },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#e0f2f1", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, color: "#00695c", fontWeight: "bold" },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  techInfo: { flex: 1 },
  techName: { fontSize: 14, fontWeight: "bold", color: "#222", textAlign: "right", fontFamily: "Cairo-SemiBold" },
  techSpecialty: { fontSize: 12, color: "#888", textAlign: "right", marginTop: 2, fontFamily: "Cairo-Regular" },
  techMeta: { fontSize: 11, color: "#f57c00", textAlign: "right", marginTop: 4, fontFamily: "Cairo-Regular" },
});
