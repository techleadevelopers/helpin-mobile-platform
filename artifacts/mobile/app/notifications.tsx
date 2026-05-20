import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import { ackNotification, getNotifications, markNotificationAsRead, type AppNotification } from '@/services/notificationService';
import { AUTH_TOKEN_KEY } from '@/services/zoohelpApi';

const getToken = () => AsyncStorage.getItem(AUTH_TOKEN_KEY);

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([
    {
      id: 'local-1',
      title: 'Emergências próximas aparecerío aqui.',
      body: 'Quando houver resgate no seu raio, o alerta chega com rota e chat.',
      isRead: false,
      createdAt: new Date().toISOString(),
      kind: 'system',
      critical: false,
    },
  ]);

  useEffect(() => {
    getNotifications(getToken).then((next) => {
      if (next.length) setItems(next);
    }).catch(() => {});
  }, []);

  async function openNotification(item: AppNotification) {
    setItems((prev) => prev.map((candidate) => candidate.id === item.id ? { ...candidate, isRead: true } : candidate));
    await Promise.all([
      markNotificationAsRead(item.id, getToken).catch(() => {}),
      ackNotification(item.id, getToken).catch(() => {}),
    ]);
    if (item.postId) router.push(`/post/${item.postId}` as any);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Notificações</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => openNotification(item)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name={item.isRead ? 'bell-outline' : 'bell-badge-outline'} size={22} color={item.isRead ? colors.mutedForeground : '#FF3B30'} />
            <View style={styles.cardBody}>
              <Text style={[styles.cardText, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.cardSubtext, { color: colors.mutedForeground }]}>{item.body}</Text>
              {item.distanceKm != null && <Text style={styles.distance}>{item.distanceKm} km de você</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  cardBody: { flex: 1, gap: 4 },
  cardText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  cardSubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  distance: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FF3B30' },
});
