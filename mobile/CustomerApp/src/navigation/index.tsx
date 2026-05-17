import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../store/auth.store";

// Auth Screens
import LoginScreen from "../features/auth/screens/LoginScreen";
import RegisterScreen from "../features/auth/screens/RegisterScreen";
import OtpScreen from "../features/auth/screens/OtpScreen";
import ForgotPasswordScreen from "../features/auth/screens/ForgotPasswordScreen";

// Home Screens
import HomeScreen from "../features/home/screens/HomeScreen";
import ServiceDetailScreen from "../features/home/screens/ServiceDetailScreen";
import TechnicianProfileScreen from "../features/home/screens/TechnicianProfileScreen";

// Request Screens
import CreateRequestScreen from "../features/requests/screens/CreateRequestScreen";
import RequestDetailScreen from "../features/requests/screens/RequestDetailScreen";
import ProposalsScreen from "../features/requests/screens/ProposalsScreen";
import TrackingScreen from "../features/requests/screens/TrackingScreen";
import RequestsListScreen from "../features/requests/screens/RequestsListScreen";

// Chat Screens
import ChatScreen from "../features/chat/screens/ChatScreen";

// Wallet Screens
import WalletScreen from "../features/wallet/screens/WalletScreen";
import TransactionsScreen from "../features/wallet/screens/TransactionsScreen";

// Profile Screens
import ProfileScreen from "../features/profile/screens/ProfileScreen";
import EditProfileScreen from "../features/profile/screens/EditProfileScreen";
import SavedAddressesScreen from "../features/profile/screens/SavedAddressesScreen";
import { Text, View } from "react-native";
import ServerSetupScreen from "../features/setup/screens/ServerSetupScreen";
import { useServerStore } from "../store/server.store";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OTP: { phone: string; purpose: string };
  ForgotPassword: undefined;
  MainTabs: undefined;
  ServiceDetail: { categoryId: number };
  TechnicianProfile: { technicianId: number };
  CreateRequest: { categoryId?: number };
  RequestDetail: { requestId: number };
  RequestsList: undefined;
  Proposals: { requestId: number };
  Tracking: { requestId: number };
  Chat: { requestId: number };
  Wallet: undefined;
  Transactions: undefined;
  EditProfile: undefined;
  SavedAddresses: undefined;
};

export type TabParamList = {
  Home: undefined;
  Requests: undefined;
  NewRequest: undefined;
  Wallet: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: "🏠", inactive: "🏠" },
  Requests: { active: "📋", inactive: "📋" },
  NewRequest: { active: "➕", inactive: "➕" },
  Wallet: { active: "💳", inactive: "💳" },
  Profile: { active: "👤", inactive: "👤" },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelStyle: { fontFamily: "Cairo-Medium", fontSize: 13, fontWeight: "bold", marginTop: 2 },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: "#fff",
          borderTopColor: "#f1f5f9",
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View
              style={{
                backgroundColor: focused ? "#eff6ff" : "transparent",
                width: 36,
                height: 36,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>{focused ? icons.active : icons.inactive}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "الرئيسية" }} />
      <Tab.Screen name="Requests" component={RequestsListScreen} options={{ title: "طلباتي" }} />
      <Tab.Screen name="NewRequest" component={CreateRequestScreen} options={{ title: "طلب جديد" }} />
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: "المحفظة" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "حسابي" }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated } = useAuthStore();
  const serverIp = useServerStore((s) => s.ip);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_left", // RTL-friendly
          contentStyle: { backgroundColor: "#f9fafb" },
        }}
      >
        {!serverIp ? (
          <Stack.Screen name="ServerSetup" component={ServerSetupScreen} />
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTP" component={OtpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ headerShown: true, title: "الخدمة" }} />
            <Stack.Screen name="TechnicianProfile" component={TechnicianProfileScreen} options={{ headerShown: true, title: "الفني" }} />
            <Stack.Screen name="CreateRequest" component={CreateRequestScreen} options={{ headerShown: true, title: "طلب جديد" }} />
            <Stack.Screen name="RequestsList" component={RequestsListScreen} options={{ headerShown: true, title: "طلباتي" }} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ headerShown: true, title: "تفاصيل الطلب" }} />
            <Stack.Screen name="Proposals" component={ProposalsScreen} options={{ headerShown: true, title: "عروض الأسعار" }} />
            <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: true, title: "تتبع الفني" }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: "المحادثة" }} />
            <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: true, title: "المحفظة" }} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: true, title: "المعاملات" }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: "تعديل الملف" }} />
            <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} options={{ headerShown: true, title: "عناوين محفوظة" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
