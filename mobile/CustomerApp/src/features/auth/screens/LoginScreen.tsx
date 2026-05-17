import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "../../../api/client";
import { useAuthStore } from "../../../store/auth.store";
import { ar } from "../../../i18n/ar";

const schema = z.object({
  phone: z.string().regex(/^\+20[0-9]{10}$/, ar.validation.invalidPhone),
  password: z.string().min(8, ar.validation.minPassword),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+201111111101", password: "Test@12345" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", data);
      const { accessToken, refreshToken, user } = response.data.data;
      login({ accessToken, refreshToken, user });
    } catch (error: any) {
      Alert.alert("خطأ", error.response?.data?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>🏘</Text>
          </View>
          <Text style={styles.title}>منصة خدمات برج العرب</Text>
          <Text style={styles.subtitle}>{ar.auth.welcomeBack}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{ar.auth.phone}</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="+201012345678"
                  keyboardType="phone-pad"
                  // textDirection="ltr"
                  textAlign="left"
                  placeholderTextColor="#9ca3af"
                />
              )}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>{ar.auth.password}</Text>
            <View style={styles.passwordContainer}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    secureTextEntry={!showPass}
                    placeholderTextColor="#9ca3af"
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{ar.auth.forgotPassword}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{ar.auth.login}</Text>}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{ar.auth.noAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>{ar.auth.register}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", fontFamily: "Cairo-Bold", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, fontFamily: "Cairo-Regular" },
  form: { backgroundColor: "#fff", borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6, fontFamily: "Cairo-SemiBold" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Cairo-Regular",
    backgroundColor: "#fff",
    textAlign: "right",
  },
  inputError: { borderColor: "#ef4444" },
  passwordContainer: { position: "relative" },
  passwordInput: { paddingLeft: 44 },
  eyeButton: { position: "absolute", left: 12, top: 12 },
  eyeIcon: { fontSize: 18 },
  errorText: { color: "#ef4444", fontSize: 12, marginTop: 4, fontFamily: "Cairo-Regular" },
  forgotBtn: { alignSelf: "flex-start", marginBottom: 20 },
  forgotText: { color: "#2563eb", fontSize: 13, fontFamily: "Cairo-Medium" },
  submitBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Cairo-Bold" },
  registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  registerText: { fontSize: 13, color: "#6b7280", fontFamily: "Cairo-Regular" },
  registerLink: { fontSize: 13, color: "#2563eb", fontWeight: "700", fontFamily: "Cairo-Bold" },
});
