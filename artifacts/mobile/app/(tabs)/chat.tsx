import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useColors } from '@/hooks/useColors';
import { formatRelativeTime } from '@/services/timeFormat';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { ChatConversationContract } from '@/services/zoohelpEngine';

const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatConversationContract[]>([]);

  const topPad = (Platform.OS === 'web' ? 0 : insets.top) + 16;

  useEffect(() => {
    createZooHelpApi()?.chatRooms().then(setConversations).catch(() => setConversations([]));
  }, []);

  const visibleConversations = useMemo(() => {
    const grouped = new Map<string, ChatConversationContract>();

    conversations.forEach((conversation) => {
      const key = conversation.participant.id;
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, conversation);
        return;
      }

      const currentTime = Date.parse(current.lastMessageTime);
      const nextTime = Date.parse(conversation.lastMessageTime);
      const latest =
        Number.isNaN(nextTime) || Number.isNaN(currentTime)
          ? current
          : nextTime > currentTime
            ? conversation
            : current;

      grouped.set(key, {
        ...latest,
        unread: current.unread + conversation.unread,
      });
    });

    return Array.from(grouped.values());
  }, [conversations]);

  function renderConversation({ item }: { item: ChatConversationContract }) {
    return (
      <TouchableOpacity
        style={[styles.convRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.92}
      >
        <View style={{ position: 'relative' }}>
          <Avatar
            name={item.participant.name}
            size={52}
            verified={item.participant.verified}
            imageUrl={item.participant.avatar}
          />
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>

        <View style={styles.convInfo}>
          <View style={styles.convHeader}>
            <Text
              style={[
                styles.convName,
                { color: colors.foreground, fontFamily: item.unread > 0 ? 'Inter_700Bold' : 'Inter_500Medium' },
              ]}
              numberOfLines={1}
            >
              {item.participant.name}
            </Text>
            <View style={styles.feedTimeRow}>
              <Image source={{ uri: FEED_TIME_ICON }} style={styles.feedTimeIcon} resizeMode="contain" />
              <Text style={[styles.feedTimeText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {formatRelativeTime(item.lastMessageTime)}
              </Text>
            </View>
          </View>
          <Text style={[styles.postTitle, { color: colors.primary }]} numberOfLines={1}>
            {item.postTitle}
          </Text>
          <Text
            style={[
              styles.lastMessage,
              {
                color: item.unread > 0 ? colors.foreground : colors.mutedForeground,
                fontFamily: item.unread > 0 ? 'Inter_500Medium' : 'Inter_400Regular',
              },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mensagens</Text>
        <TouchableOpacity
          style={[
            styles.composeBtn,
            {
              backgroundColor: colors.primary + '14',
              borderColor: colors.primary + '45',
              shadowColor: colors.primary,
            },
          ]}
          onPress={() => router.push('/search')}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 65 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="message-outline"
            title="Nenhuma conversa ainda"
            subtitle="Quando você demonstrar interesse em adotar ou ajudar, as conversas aparecerío aqui."
            iconColor="#2F80ED"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: { paddingTop: 4 },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  convInfo: { flex: 1, gap: 3 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: { fontSize: 15, flex: 1, marginRight: 8 },
  convTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeIcon: { width: 13, height: 13, opacity: 0.72 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  postTitle: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  lastMessage: { fontSize: 13, lineHeight: 18 },
  separator: { height: 1, marginLeft: 80 },
});
