import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useServerStore } from "@store/server.store";
import { RootStackParamList } from "@/navigation";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function ServerSetupScreen({ navigation }: Props) {
  const [ip, setIp] = useState("192.168.0.128");
  const [port, setPort] = useState("5000");
  const setServerIp = useServerStore((s) => s.setIp);

  const handleSave = () => {
    const trimmed = ip.trim();
    if (!trimmed) {
      Alert.alert("خطأ", "يرجى إدخال عنوان IP الخادم");
      return;
    }
    // basic IP or hostname validation
    const valid = /^[\d.]+$/.test(trimmed) || /^[a-zA-Z0-9.-]+$/.test(trimmed);
    if (!valid) {
      Alert.alert("خطأ", "عنوان IP غير صحيح");
      return;
    }
    const portNum = parseInt(port, 10);
    if (!port || isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert("خطأ", "رقم المنفذ غير صحيح");
      return;
    }
    setServerIp(portNum === 5000 ? trimmed : `${trimmed}:${portNum}`);
    navigation.replace("Login");
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        <Text style={styles.logo}>🏙️</Text>
        <Text style={styles.title}>إعداد الخادم</Text>
        <Text style={styles.subtitle}>أدخل عنوان IP الخادم للاتصال بالتطبيق</Text>

        <View style={styles.card}>
          <Text style={styles.label}>عنوان IP الخادم</Text>
          <TextInput
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            placeholder="مثال: 192.168.1.100"
            keyboardType="decimal-pad"
            textAlign="right"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>رقم المنفذ (Port)</Text>
          <TextInput style={styles.input} value={port} onChangeText={setPort} placeholder="5000" keyboardType="number-pad" textAlign="right" />

          <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.btnText}>حفظ والمتابعة</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>يتم حفظ هذا الإعداد محلياً ولن يُطلب منك مجدداً</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  logo: { fontSize: 56, textAlign: "center", marginBottom: 16 },
  title: { fontSize: 24, fontFamily: "Cairo-Bold", color: "#0f172a", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: "Cairo-Regular", color: "#64748b", textAlign: "center", marginBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  label: { fontSize: 13, fontFamily: "Cairo-SemiBold", color: "#334155", textAlign: "right", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Cairo-Regular",
    marginBottom: 18,
    backgroundColor: "#f8fafc",
    textAlign: "right",
  },
  btn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Cairo-Bold" },
  hint: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 20, fontFamily: "Cairo-Regular" },
});
