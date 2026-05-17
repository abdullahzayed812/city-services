import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { launchImageLibrary } from "react-native-image-picker";
import Geolocation from "react-native-geolocation-service";
import { apiClient } from "../../../api/client";
import { ar } from "../../../i18n/ar";

type RequestType = "instant" | "scheduled" | "emergency";

export default function CreateRequestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { categoryId } = route.params || {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("instant");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get("/services").then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post("/requests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (response) => {
      Alert.alert("نجاح", "تم إرسال طلبك بنجاح. انتظر عروض الفنيين", [
        {
          text: "عرض الطلب",
          onPress: () => navigation.navigate("RequestDetail", { requestId: response.data.data.id }),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("خطأ", error.response?.data?.message || "فشل إرسال الطلب");
    },
  });

  const detectLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAddress("تم تحديد موقعك الحالي");
      },
      (error) => Alert.alert("خطأ", "تعذر تحديد الموقع: " + error.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const pickImages = async () => {
    const result = await launchImageLibrary({ mediaType: "photo", selectionLimit: 5 });
    if (result.assets) {
      setImages(result.assets.map((a) => a.uri!).slice(0, 5));
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) {
      Alert.alert("خطأ", "يرجى اختيار نوع الخدمة");
      return;
    }
    if (!title.trim()) {
      Alert.alert("خطأ", "يرجى إدخال عنوان الطلب");
      return;
    }
    if (!description.trim()) {
      Alert.alert("خطأ", "يرجى وصف المشكلة");
      return;
    }
    if (!address.trim()) {
      Alert.alert("خطأ", "يرجى تحديد الموقع");
      return;
    }

    const formData = new FormData();
    formData.append("category_id", selectedCategory);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("request_type", requestType);
    formData.append("address", address);
    formData.append("latitude", String(latitude || 30.8868));
    formData.append("longitude", String(longitude || 29.7573));
    if (budgetFrom) formData.append("budget_from", budgetFrom);
    if (budgetTo) formData.append("budget_to", budgetTo);

    images.forEach((uri, i) => {
      formData.append("images", { uri, type: "image/jpeg", name: `image_${i}.jpg` } as any);
    });

    createMutation.mutate(formData);
  };

  const TYPE_OPTIONS: { value: RequestType; label: string; color: string }[] = [
    { value: "instant", label: ar.request.instant, color: "#2563eb" },
    { value: "scheduled", label: ar.request.scheduled, color: "#7c3aed" },
    { value: "emergency", label: ar.request.emergency, color: "#ef4444" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ar.request.createRequest}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Request Type */}
        <View style={styles.section}>
          <Text style={styles.label}>نوع الطلب</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeBtn, requestType === opt.value && { backgroundColor: opt.color, borderColor: opt.color }]}
                onPress={() => setRequestType(opt.value)}
              >
                <Text style={[styles.typeText, requestType === opt.value && styles.typeTxtSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>نوع الخدمة *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(categories || []).map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, selectedCategory === cat.id && styles.catChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text>{cat.icon_url}</Text>
                <Text style={[styles.catChipText, selectedCategory === cat.id && { color: "#fff" }]}>{cat.name_ar}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>عنوان المشكلة *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="مثال: تسريب في الحمام"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>وصف المشكلة *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="اذكر تفاصيل المشكلة بدقة..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            textAlign="right"
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>الموقع *</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="العنوان بالتفصيل"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />
          <TouchableOpacity style={styles.locationBtn} onPress={detectLocation}>
            <Text style={styles.locationBtnText}>📍 تحديد موقعي الحالي</Text>
          </TouchableOpacity>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.label}>الميزانية المتوقعة (اختياري)</Text>
          <View style={styles.budgetRow}>
            <TextInput
              style={[styles.input, styles.budgetInput]}
              value={budgetFrom}
              onChangeText={setBudgetFrom}
              placeholder="من"
              keyboardType="numeric"
              textAlign="center"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.budgetSep}>-</Text>
            <TextInput
              style={[styles.input, styles.budgetInput]}
              value={budgetTo}
              onChangeText={setBudgetTo}
              placeholder="إلى"
              keyboardType="numeric"
              textAlign="center"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.budgetUnit}>ج.م</Text>
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>{ar.request.uploadImages}</Text>
          <TouchableOpacity style={styles.imageUploadBtn} onPress={pickImages}>
            <Text style={styles.imageUploadIcon}>📷</Text>
            <Text style={styles.imageUploadText}>اختر صور (حتى 5)</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewRow}>
              {images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.imagePreview} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
        >
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{ar.request.send}</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: { padding: 8, marginLeft: 8 },
  backIcon: { fontSize: 20, color: "#374151", transform: [{ scaleX: -1 }] },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Cairo-Bold", color: "#111827", textAlign: "center" },
  scroll: { flex: 1 },
  section: { backgroundColor: "#fff", marginTop: 8, padding: 16 },
  label: { fontSize: 14, fontFamily: "Cairo-SemiBold", color: "#374151", marginBottom: 10, textAlign: "right" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Cairo-Regular",
  },
  textarea: { height: 100, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#d1d5db", alignItems: "center" },
  typeText: { fontSize: 13, fontFamily: "Cairo-Medium", color: "#374151" },
  typeTxtSelected: { color: "#fff" },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginLeft: 8,
    backgroundColor: "#fff",
  },
  catChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  catChipText: { fontSize: 13, fontFamily: "Cairo-Medium", color: "#374151" },
  locationBtn: { marginTop: 10, backgroundColor: "#eff6ff", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  locationBtnText: { color: "#2563eb", fontFamily: "Cairo-Medium", fontSize: 14 },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  budgetInput: { flex: 1 },
  budgetSep: { fontSize: 18, color: "#9ca3af" },
  budgetUnit: { fontSize: 14, color: "#6b7280", fontFamily: "Cairo-Regular" },
  imageUploadBtn: { borderWidth: 1.5, borderColor: "#d1d5db", borderStyle: "dashed", borderRadius: 12, paddingVertical: 20, alignItems: "center", gap: 8 },
  imageUploadIcon: { fontSize: 28 },
  imageUploadText: { fontSize: 14, color: "#6b7280", fontFamily: "Cairo-Regular" },
  imagePreviewRow: { marginTop: 10 },
  imagePreview: { width: 80, height: 80, borderRadius: 8, marginLeft: 8 },
  submitBtn: { margin: 16, backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Cairo-Bold" },
});
