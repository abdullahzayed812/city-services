import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> };

export default function ProposalsScreen({ navigation, route }: Props) {
  const { requestId } = route.params as { requestId: number };
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["proposals", requestId],
    queryFn: async () => {
      const res = await apiClient.get(`/proposals?requestId=${requestId}`);
      return res.data.data;
    },
  });

  const accept = useMutation({
    mutationFn: async (proposalId: number) => {
      await apiClient.post(`/proposals/${proposalId}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-requests"] });
      qc.invalidateQueries({ queryKey: ["request", requestId] });
      Alert.alert("تم", "تم قبول العرض بنجاح");
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert("خطأ", err.response?.data?.message ?? ar.common.error);
    },
  });

  const handleAccept = (proposalId: number, techName: string, price: number) => {
    Alert.alert("تأكيد القبول", `قبول عرض ${techName} بسعر ${price} ${ar.common.egp}؟`, [
      { text: ar.common.cancel, style: "cancel" },
      { text: ar.common.confirm, onPress: () => accept.mutate(proposalId) },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.techInfo}>
          <Text style={styles.techName}>{item.technician_name}</Text>
          <Text style={styles.techMeta}>
            ⭐ {item.rating_average} · {item.completed_jobs} وظيفة
          </Text>
          <Text style={styles.techSpecialty}>{item.specialty}</Text>
        </View>
        <Text style={styles.price}>
          {item.proposed_price} {ar.common.egp}
        </Text>
      </View>
      {item.message ? <Text style={styles.note}>{item.message}</Text> : null}
      <TouchableOpacity
        style={[styles.acceptBtn, accept.isPending && styles.btnDisabled]}
        onPress={() => handleAccept(item.id, item.technician_name, item.proposed_price)}
        disabled={accept.isPending}
      >
        {accept.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.acceptBtnText}>قبول هذا العرض</Text>}
      </TouchableOpacity>
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
    <View style={styles.container}>
      <Text style={styles.header}>عروض الأسعار ({data?.length ?? 0})</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>لا توجد عروض بعد</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { fontSize: 18, fontWeight: "bold", color: "#00695c", padding: 16, textAlign: "right", fontFamily: "Cairo-Bold" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  techInfo: { flex: 1 },
  techName: { fontSize: 15, fontWeight: "bold", color: "#222", textAlign: "right", fontFamily: "Cairo-Bold" },
  techMeta: { fontSize: 12, color: "#f57c00", textAlign: "right", marginTop: 2, fontFamily: "Cairo-Regular" },
  techSpecialty: { fontSize: 12, color: "#888", textAlign: "right", marginTop: 2, fontFamily: "Cairo-Regular" },
  price: { fontSize: 20, fontWeight: "bold", color: "#00695c", fontFamily: "Cairo-Bold" },
  note: { fontSize: 13, color: "#555", textAlign: "right", marginBottom: 12, fontFamily: "Cairo-Regular" },
  acceptBtn: { backgroundColor: "#00695c", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold", fontFamily: "Cairo-Bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#999", fontFamily: "Cairo-Regular" },
});
