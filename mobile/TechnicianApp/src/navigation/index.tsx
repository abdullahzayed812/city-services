import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {createBottomTabNavigator, BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {Text} from 'react-native';
import {useAuthStore} from '@store/auth.store';
import {useServerStore} from '@store/server.store';
import ServerSetupScreen from '@features/setup/screens/ServerSetupScreen';

import LoginScreen from '@features/auth/screens/LoginScreen';
import RegisterScreen from '@features/auth/screens/RegisterScreen';
import OtpScreen from '@features/auth/screens/OtpScreen';
import ForgotPasswordScreen from '@features/auth/screens/ForgotPasswordScreen';
import DashboardScreen from '@features/dashboard/screens/DashboardScreen';
import NearbyRequestsScreen from '@features/requests/screens/NearbyRequestsScreen';
import RequestDetailScreen from '@features/requests/screens/RequestDetailScreen';
import MyJobsScreen from '@features/jobs/screens/MyJobsScreen';
import ChatScreen from '@features/chat/screens/ChatScreen';
import WalletScreen from '@features/wallet/screens/WalletScreen';
import WithdrawScreen from '@features/wallet/screens/WithdrawScreen';
import ProfileScreen from '@features/profile/screens/ProfileScreen';
import EditProfileScreen from '@features/profile/screens/EditProfileScreen';
import DocumentsScreen from '@features/profile/screens/DocumentsScreen';
import ServicesManagementScreen from '@features/profile/screens/ServicesManagementScreen';
import PortfolioScreen from '@features/profile/screens/PortfolioScreen';

// ─── Route param lists ────────────────────────────────────────────────────────

export type SetupStackParamList = {
  ServerSetup: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OTP: {phone: string; purpose: string};
  ForgotPassword: undefined;
};

export type AppStackParamList = {
  Main: undefined;
  RequestDetail: {requestId: number};
  Chat: {requestId: number; customerName?: string};
  Withdraw: undefined;
  EditProfile: undefined;
  Documents: undefined;
  ServicesManagement: undefined;
  Portfolio: undefined;
};

export type TabParamList = {
  الرئيسية: undefined;
  الطلبات: undefined;
  وظائفي: undefined;
  المحفظة: undefined;
  حسابي: undefined;
};

// ─── Per-screen props helpers (import these in screen files) ─────────────────

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  const icons: Record<string, string> = {
    'الرئيسية': '🏠', 'الطلبات': '📋', 'وظائفي': '🔧', 'المحفظة': '💰', 'حسابي': '👤',
  };
  return <Text style={{fontSize: 22, opacity: focused ? 1 : 0.5}}>{icons[label] ?? '●'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#1a237e',
        tabBarInactiveTintColor: '#aaa',
        tabBarLabelStyle: {fontFamily: 'Cairo-Regular', fontSize: 13},
        headerShown: false,
      })}>
      <Tab.Screen name="الرئيسية" component={DashboardScreen} />
      <Tab.Screen name="الطلبات" component={NearbyRequestsScreen} />
      <Tab.Screen name="وظائفي" component={MyJobsScreen} />
      <Tab.Screen name="المحفظة" component={WalletScreen} />
      <Tab.Screen name="حسابي" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{headerBackTitle: 'رجوع'}}>
      <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{title: 'تفاصيل الطلب'}} />
      <Stack.Screen name="Chat" component={ChatScreen} options={({route}) => ({title: route.params.customerName ?? 'المحادثة'})} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} options={{title: 'سحب الرصيد'}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{title: 'تعديل الملف'}} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{title: 'المستندات'}} />
      <Stack.Screen name="ServicesManagement" component={ServicesManagementScreen} options={{title: 'خدماتي'}} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{title: 'معرض الأعمال'}} />
    </Stack.Navigator>
  );
}

const SetupStack = createNativeStackNavigator<SetupStackParamList>();

export default function Navigation() {
  const {isAuthenticated} = useAuthStore();
  const serverIp = useServerStore(s => s.ip);

  return (
    <NavigationContainer>
      {!serverIp ? (
        <SetupStack.Navigator screenOptions={{headerShown: false}}>
          <SetupStack.Screen name="ServerSetup" component={ServerSetupScreen} />
        </SetupStack.Navigator>
      ) : isAuthenticated ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
