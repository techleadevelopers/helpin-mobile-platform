import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTH_TOKEN_KEY, createZooHelpApi } from '@/services/zoohelpApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';

type NotificationItem = { id: string; title: string; read: boolean };

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>([
    { id: 'local-1', title: 'Emergências próximas aparecerão aqui.', read: false },
  ]);

  useEffect(() => {
    const api = createZooHelpApi(() => AsyncStorage.getItem(AUTH_TOKEN_KEY));
    api?.notifications().then(setItems).catch(() => {});
  }, []);

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
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name={item.read ? 'bell-outline' : 'bell-badge-outline'} size={22} color={item.read ? colors.mutedForeground : '#FF3B30'} />
            <Text style={[styles.cardText, { color: colors.foreground }]}>{item.title}</Text>
          </View>
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
  cardText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
});
