import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {apiClient, mediaUrl} from '@api/client';
import {useAuthStore} from '@store/auth.store';
import {ar} from '@i18n/ar';

type Props = {navigation: NativeStackNavigationProp<any>};

const VERIFICATION_CONFIG = {
  pending: {color: '#f57c00', bg: '#fff8e1', text: ar.dashboard.verificationPending},
  approved: {color: '#2e7d32', bg: '#e8f5e9', text: ar.dashboard.verificationApproved},
  rejected: {color: '#c62828', bg: '#ffebee', text: ar.dashboard.verificationRejected},
};

export default function ProfileScreen({navigation}: Props) {
  const {user, logout} = useAuthStore();

  const {data: profile, isLoading} = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/technicians/me');
      return res.data.data;
    },
  });

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      {text: ar.common.cancel, style: 'cancel'},
      {text: ar.auth.logout, style: 'destructive', onPress: logout},
    ]);
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1a237e" /></View>;
  }

  const verCfg = VERIFICATION_CONFIG[profile?.verification_status as keyof typeof VERIFICATION_CONFIG] ?? VERIFICATION_CONFIG.pending;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile?.avatar_url ? (
          <Image source={{uri: mediaUrl(profile.avatar_url)}} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.fullName?.[0] ?? 'ف'}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={[styles.verBadge, {backgroundColor: verCfg.bg}]}>
          <Text style={[styles.verText, {color: verCfg.color}]}>{verCfg.text}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBox label={ar.profile.rating} value={`${profile?.rating_average ?? 0} ★`} />
        <StatBox label={ar.profile.completedJobs} value={String(profile?.completed_jobs ?? 0)} />
        <StatBox label={ar.profile.experience} value={`${profile?.experience_years ?? 0} سنة`} />
      </View>

      <View style={styles.section}>
        <MenuItem icon="✏️" label={ar.profile.edit} onPress={() => navigation.navigate('EditProfile')} />
        <MenuItem icon="📄" label={ar.profile.documents} onPress={() => navigation.navigate('Documents')} />
        <MenuItem icon="🖼️" label={ar.profile.portfolio} onPress={() => navigation.navigate('Portfolio')} />
        <MenuItem icon="🔧" label={ar.profile.services} onPress={() => navigation.navigate('ServicesManagement')} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{ar.auth.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({icon, label, onPress}: {icon: string; label: string; onPress: () => void}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>›</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuEmoji}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  content: {paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {backgroundColor: '#1a237e', alignItems: 'center', padding: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28},
  avatar: {width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff', marginBottom: 12},
  avatarPlaceholder: {width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12},
  avatarText: {fontSize: 36, color: '#fff', fontWeight: 'bold'},
  name: {fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4, fontFamily: 'Cairo-Bold'},
  phone: {fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontFamily: 'Cairo-Regular'},
  verBadge: {paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20},
  verText: {fontSize: 12, fontWeight: 'bold', fontFamily: 'Cairo-SemiBold'},
  statsRow: {flexDirection: 'row', margin: 16, gap: 12},
  statBox: {flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2},
  statValue: {fontSize: 18, fontWeight: 'bold', color: '#1a237e', fontFamily: 'Cairo-Bold'},
  statLabel: {fontSize: 11, color: '#888', marginTop: 4, fontFamily: 'Cairo-Regular'},
  section: {backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginBottom: 16, elevation: 2, overflow: 'hidden'},
  menuItem: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  menuEmoji: {fontSize: 20, marginLeft: 12},
  menuLabel: {flex: 1, fontSize: 14, color: '#333', fontFamily: 'Cairo-Regular'},
  menuIcon: {fontSize: 18, color: '#ccc'},
  logoutBtn: {marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ffebee', alignItems: 'center'},
  logoutText: {color: '#c62828', fontSize: 14, fontWeight: 'bold', fontFamily: 'Cairo-Bold'},
});
