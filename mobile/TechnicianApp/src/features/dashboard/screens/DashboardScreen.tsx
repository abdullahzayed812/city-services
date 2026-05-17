import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Geolocation from 'react-native-geolocation-service';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/auth.store';
import { io, Socket } from 'socket.io-client';

const API_URL = __DEV__ ? 'http://192.168.0.128:5000' : 'https://api.cityservices.eg';

export default function TechnicianDashboardScreen() {
  const { user, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const locationWatchRef = useRef<number | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['technician-profile'],
    queryFn: () => apiClient.get('/technicians/profile').then(r => r.data.data),
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get('/wallet').then(r => r.data.data),
  });

  const availabilityMutation = useMutation({
    mutationFn: (availability: string) => apiClient.patch('/technicians/availability', { availability }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technician-profile'] }),
  });

  const isOnline = profile?.availability === 'online';

  const toggleAvailability = () => {
    const newAvailability = isOnline ? 'offline' : 'online';
    availabilityMutation.mutate(newAvailability);

    if (newAvailability === 'online') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  };

  const startLocationTracking = () => {
    locationWatchRef.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketRef.current?.emit('technician:update_location', { latitude, longitude });
        apiClient.patch('/technicians/location', { latitude, longitude });
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, distanceFilter: 50, interval: 10000 }
    );
  };

  const stopLocationTracking = () => {
    if (locationWatchRef.current !== null) {
      Geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  };

  useEffect(() => {
    // Connect socket
    const socket = io(API_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('Socket connected'));

    socket.on('request:new_nearby', (data: any) => {
      Alert.alert(
        'طلب جديد!',
        `${data.title}\nالمسافة: ${data.distance_km?.toFixed(1)} كم`,
        [
          { text: 'عرض الطلب', onPress: () => {} },
          { text: 'تجاهل', style: 'cancel' },
        ]
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      stopLocationTracking();
    };
  }, [accessToken]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>مرحباً 👨‍🔧</Text>
            <Text style={styles.name}>{user?.full_name}</Text>
          </View>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityLabel}>{isOnline ? 'متصل ✅' : 'غير متصل'}</Text>
            <Switch
              value={isOnline}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              thumbColor={isOnline ? '#22c55e' : '#9ca3af'}
            />
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{parseFloat(wallet?.balance || '0').toFixed(0)}</Text>
          <Text style={styles.statLabel}>رصيد المحفظة (ج)</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.completed_jobs || 0}</Text>
          <Text style={styles.statLabel}>وظائف مكتملة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {'★'.repeat(Math.round(parseFloat(profile?.rating_average || '0')))}
          </Text>
          <Text style={styles.statLabel}>{parseFloat(profile?.rating_average || '0').toFixed(1)} تقييم</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.rating_count || 0}</Text>
          <Text style={styles.statLabel}>عدد التقييمات</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: '📋', label: 'الطلبات القريبة', color: '#dbeafe' },
            { icon: '💬', label: 'المحادثات', color: '#f0fdf4' },
            { icon: '👤', label: 'ملفي الشخصي', color: '#fef3c7' },
            { icon: '💰', label: 'المحفظة', color: '#fce7f3' },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionCard, { backgroundColor: action.color }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Verification Status */}
      {profile?.verification_status !== 'approved' && (
        <View style={styles.verificationBanner}>
          <Text style={styles.verificationIcon}>⚠️</Text>
          <View>
            <Text style={styles.verificationTitle}>حسابك قيد المراجعة</Text>
            <Text style={styles.verificationText}>تأكد من رفع جميع وثائق الهوية لتسريع الموافقة</Text>
          </View>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1d4ed8', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Cairo-Regular' },
  name: { color: '#fff', fontSize: 20, fontFamily: 'Cairo-Bold' },
  availabilityCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center', gap: 6 },
  availabilityLabel: { color: '#fff', fontSize: 12, fontFamily: 'Cairo-SemiBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 0 },
  statCard: { width: '50%', padding: 4 },
  statCardInner: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontFamily: 'Cairo-Bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', fontFamily: 'Cairo-Regular', marginTop: 4 },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Cairo-Bold', color: '#111827', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', padding: 16, borderRadius: 14, alignItems: 'center', gap: 8 },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontFamily: 'Cairo-SemiBold', color: '#374151', textAlign: 'center' },
  verificationBanner: { margin: 16, backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  verificationIcon: { fontSize: 24 },
  verificationTitle: { fontSize: 14, fontFamily: 'Cairo-Bold', color: '#92400e' },
  verificationText: { fontSize: 12, color: '#78350f', fontFamily: 'Cairo-Regular', marginTop: 2 },
});
