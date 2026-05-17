import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, StatusBar } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@store/auth.store";
import { ar } from "@i18n/ar";

type Props = { navigation: NativeStackNavigationProp<any> };

const MENU_ITEMS = [
  { icon: "✏️", label: "تعديل الملف الشخصي", screen: "EditProfile", color: "#2563eb" },
  { icon: "📍", label: "العناوين المحفوظة", screen: "SavedAddresses", color: "#0891b2" },
  { icon: "📋", label: "طلباتي", screen: "RequestsList", color: "#7c3aed" },
  { icon: "💳", label: "المحفظة", screen: "Wallet", color: "#059669" },
];

const INFO_ITEMS = [
  { icon: "🔒", label: "الخصوصية والأمان", screen: null, color: "#64748b" },
  { icon: "🔔", label: "إعدادات الإشعارات", screen: null, color: "#64748b" },
  { icon: "ℹ️", label: "عن التطبيق", screen: null, color: "#64748b" },
];

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const initials =
    user?.full_name
      ?.split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("") ?? "ع";

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج من حسابك؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ حساب موثق</Text>
          </View>
        </View>

        {/* Main menu */}
        <View style={styles.card}>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={() => item.screen && navigation.navigate(item.screen)} activeOpacity={0.7}>
                <Text style={styles.menuChevron}>‹</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={[styles.menuIconBox, { backgroundColor: item.color + "18" }]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Info menu */}
        <View style={styles.card}>
          {INFO_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
                <Text style={styles.menuChevron}>‹</Text>
                <Text style={[styles.menuLabel, { color: "#64748b" }]}>{item.label}</Text>
                <View style={[styles.menuIconBox, { backgroundColor: "#f1f5f9" }]}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                </View>
              </TouchableOpacity>
              {i < INFO_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{ar.auth.logout}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>نسخة التطبيق 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  scroll: { paddingBottom: 40 },

  header: {
    backgroundColor: "#2563eb",
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 30, color: "#fff", fontFamily: "Cairo-Bold" },
  name: { fontSize: 20, fontFamily: "Cairo-Bold", color: "#fff", marginBottom: 4 },
  phone: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Cairo-Regular", marginBottom: 10 },
  verifiedBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  verifiedText: { color: "#fff", fontSize: 12, fontFamily: "Cairo-Medium" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, color: "#0f172a", fontFamily: "Cairo-Medium", textAlign: "right", marginHorizontal: 12 },
  menuChevron: { color: "#cbd5e1", fontSize: 22, fontWeight: "300" },
  divider: { height: 1, backgroundColor: "#f8fafc", marginHorizontal: 18 },

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontFamily: "Cairo-Bold", color: "#ef4444" },

  version: { textAlign: "center", fontSize: 11, color: "#cbd5e1", fontFamily: "Cairo-Regular", marginTop: 20 },
});
