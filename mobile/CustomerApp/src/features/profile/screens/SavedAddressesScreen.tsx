import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";

interface Address {
  id: number;
  label: string;
  address: string;
  is_default: boolean;
}

export default function SavedAddressesScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["saved-addresses"],
    queryFn: async () => {
      const res = await apiClient.get("/customers/me/addresses");
      return res.data.data as Address[];
    },
  });

  const addAddress = useMutation({
    mutationFn: async () => {
      await apiClient.post("/customers/me/addresses", { label, address });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-addresses"] });
      setLabel("");
      setAddress("");
      setShowForm(false);
    },
    onError: (err: any) => {
      Alert.alert("خطأ", err.response?.data?.message ?? ar.common.error);
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/customers/me/addresses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-addresses"] });
    },
  });

  const renderItem = ({ item }: { item: Address }) => (
    <View style={styles.addrCard}>
      <View style={styles.addrInfo}>
        <View style={styles.addrHeader}>
          <Text style={styles.addrLabel}>{item.label}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>افتراضي</Text>
            </View>
          )}
        </View>
        <Text style={styles.addrText}>{item.address}</Text>
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("حذف", "حذف هذا العنوان؟", [
            { text: ar.common.cancel, style: "cancel" },
            { text: "حذف", style: "destructive", onPress: () => deleteAddress.mutate(item.id) },
          ])
        }
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>+ إضافة عنوان جديد</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>التسمية (مثال: المنزل، العمل)</Text>
          <TextInput style={styles.input} value={label} onChangeText={setLabel} textAlign="right" placeholder="المنزل" />
          <Text style={styles.label}>العنوان التفصيلي</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={address}
            onChangeText={setAddress}
            multiline
            textAlign="right"
            placeholder="الشارع، المنطقة..."
          />
          <TouchableOpacity
            style={[styles.saveBtn, addAddress.isPending && styles.btnDisabled]}
            onPress={() => addAddress.mutate()}
            disabled={addAddress.isPending}
          >
            {addAddress.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{ar.common.save}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00695c" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  addBtn: { margin: 16, backgroundColor: "#00695c", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold", fontFamily: "Cairo-Bold" },
  form: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, textAlign: "right", fontFamily: "Cairo-SemiBold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  textarea: { height: 70, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#00695c", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Cairo-Bold" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  addrCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  addrInfo: { flex: 1 },
  addrHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  addrLabel: { fontSize: 14, fontWeight: "bold", color: "#333", fontFamily: "Cairo-SemiBold" },
  defaultBadge: { backgroundColor: "#e0f2f1", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  defaultText: { fontSize: 10, color: "#00695c", fontFamily: "Cairo-SemiBold" },
  addrText: { fontSize: 13, color: "#666", textAlign: "right", fontFamily: "Cairo-Regular" },
  deleteIcon: { fontSize: 20, marginLeft: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, color: "#999", fontFamily: "Cairo-Regular" },
});
