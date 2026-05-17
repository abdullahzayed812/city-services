import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { apiClient } from "@api/client";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any> };

export default function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({ phone: "", password: "", confirmPassword: "", fullName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.phone || !form.password || !form.fullName) {
      setError(ar.validation.required);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(ar.validation.passwordMismatch);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/auth/register", {
        phone: form.phone,
        password: form.password,
        fullName: form.fullName,
        role: "customer",
      });
      navigation.navigate("OTP", { phone: form.phone, purpose: "register" });
    } catch (err: any) {
      setError(err.response?.data?.message ?? ar.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{ar.auth.register}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{ar.auth.fullName}</Text>
        <TextInput style={styles.input} value={form.fullName} onChangeText={(v) => update("fullName", v)} textAlign="right" />

        <Text style={styles.label}>{ar.auth.phone}</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" textAlign="right" />

        <Text style={styles.label}>{ar.auth.password}</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={(v) => update("password", v)} secureTextEntry textAlign="right" />

        <Text style={styles.label}>{ar.auth.confirmPassword}</Text>
        <TextInput style={styles.input} value={form.confirmPassword} onChangeText={(v) => update("confirmPassword", v)} secureTextEntry textAlign="right" />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{ar.auth.register}</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.hintText}>{ar.auth.haveAccount}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}> {ar.auth.loginNow}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#00695c", textAlign: "center", marginBottom: 24, fontFamily: "Cairo-Bold" },
  error: { color: "#e53935", textAlign: "center", marginBottom: 12, fontFamily: "Cairo-Regular" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, textAlign: "right", fontFamily: "Cairo-SemiBold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: "#fff",
    fontFamily: "Cairo-Regular",
  },
  btn: { backgroundColor: "#00695c", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", fontFamily: "Cairo-Bold" },
  row: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  hintText: { color: "#666", fontSize: 13, fontFamily: "Cairo-Regular" },
  linkText: { color: "#00695c", fontSize: 13, fontFamily: "Cairo-SemiBold" },
});
