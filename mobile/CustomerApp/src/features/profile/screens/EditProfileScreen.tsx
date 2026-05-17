import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiClient } from "@api/client";
import { useAuthStore } from "@store/auth.store";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any> };

export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? "");

  const update = useMutation({
    mutationFn: async () => {
      const res = await apiClient.put("/customers/me", { fullName });
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(data);
      Alert.alert("تم", "تم تحديث الملف الشخصي");
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert("خطأ", err.response?.data?.message ?? ar.common.error);
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>{ar.auth.fullName}</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} textAlign="right" placeholder="اسمك الكامل" />

      <TouchableOpacity style={[styles.btn, update.isPending && styles.btnDisabled]} onPress={() => update.mutate()} disabled={update.isPending}>
        {update.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{ar.common.save}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 24 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontFamily: "Cairo-SemiBold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
    backgroundColor: "#fff",
    fontFamily: "Cairo-Regular",
  },
  btn: { backgroundColor: "#00695c", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", fontFamily: "Cairo-Bold" },
});
