import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@store/auth.store";
import { apiClient } from "@api/client";
import { useQuery } from "@tanstack/react-query";

const SOCKET_URL = "http://192.168.0.128:5000";

type Props = { navigation: NativeStackNavigationProp<any>; route: RouteProp<any> };

interface Location {
  latitude: number;
  longitude: number;
}

export default function TrackingScreen({ route }: Props) {
  const { requestId } = route.params as { requestId: number };
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [technicianLocation, setTechnicianLocation] = useState<Location | null>(null);
  const mapRef = useRef<MapView>(null);

  const { data: request } = useQuery({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const res = await apiClient.get(`/requests/${requestId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("customer:track_technician", { requestId });
    });

    socket.on("technician:location_update", (data: Location) => {
      setTechnicianLocation(data);
      mapRef.current?.animateToRegion(
        {
          ...data,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, requestId]);

  if (!request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00695c" />
      </View>
    );
  }

  const requestLocation = request.latitude && request.longitude ? { latitude: parseFloat(request.latitude), longitude: parseFloat(request.longitude) } : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={
          requestLocation
            ? { ...requestLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : { latitude: 30.8, longitude: 29.6, latitudeDelta: 0.1, longitudeDelta: 0.1 }
        }
      >
        {requestLocation && <Marker coordinate={requestLocation} title="موقع الطلب" pinColor="#00695c" />}
        {technicianLocation && (
          <Marker coordinate={technicianLocation} title="الفني" pinColor="#1a237e">
            <View style={styles.techMarker}>
              <Text style={styles.techMarkerText}>🔧</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{technicianLocation ? "📍 الفني قيد التتبع المباشر" : "⏳ في انتظار تحديد موقع الفني..."}</Text>
        {request.technician_name && <Text style={styles.techName}>الفني: {request.technician_name}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  infoBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    alignItems: "center",
  },
  infoText: { fontSize: 14, color: "#333", fontFamily: "Cairo-Regular", marginBottom: 4 },
  techName: { fontSize: 16, fontWeight: "bold", color: "#00695c", fontFamily: "Cairo-Bold" },
  techMarker: { backgroundColor: "#1a237e", borderRadius: 20, padding: 6 },
  techMarkerText: { fontSize: 18 },
});
