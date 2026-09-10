import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { formatRelativeTime } from '@/services/timeFormat';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { ChatConversationContract } from '@/services/zoohelpEngine';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshChatState } = useApp();
  const [conversations, setConversations] = useState<ChatConversationContract[]>([]);

  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  useEffect(() => {
    refreshConversations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshConversations();
      refreshChatState().catch(() => {});
    }, [refreshChatState])
  );

  function refreshConversations() {
    createZooHelpApi()?.chatRooms().then(setConversations).catch(() => setConversations([]));
  }

  function renderConversation({ item }: { item: ChatConversationContract }) {
    return (
      <TouchableOpacity
        style={[styles.convRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        onPress={() => {
          router.push(`/chat/${item.id}`);
          setTimeout(() => refreshChatState().catch(() => {}), 600);
        }}
        activeOpacity={0.92}
      >
        <View style={{ position: 'relative' }}>
          <Avatar
            name={item.participant.name}
            size={42}
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
              <MaterialCommunityIcons name="clock-outline" size={12} color={colors.mutedForeground} />
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
        <Text style={styles.headerTitle}>Mensagens</Text>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => router.push('/(tabs)/search')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color="#607066" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.conversationList}
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 65 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma conversa ainda</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Quando voce demonstrar interesse em adotar ou ajudar, as conversas aparecerao aqui.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: '#F4F6F3',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  composeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F0',
    borderWidth: 1,
    borderColor: '#D5DCD6',
  },
  conversationList: { backgroundColor: '#F5F7F2' },
  listContent: { paddingTop: 0 },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.56,
    paddingHorizontal: 24,
    paddingBottom: 44,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    maxWidth: 350,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
  convInfo: { flex: 1, gap: 1 },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: { fontSize: 13, flex: 1, marginRight: 8 },
  convTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  postTitle: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  lastMessage: { fontSize: 12, lineHeight: 17 },
  separator: { height: 1, marginLeft: 0 },
});
