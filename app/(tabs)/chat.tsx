import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { formatRelativeTime } from '@/services/timeFormat';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { ChatConversationContract } from '@/services/zoohelpEngine';

const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

const ZOOHELP_HEADER_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshChatState } = useApp();
  const [conversations, setConversations] = useState<ChatConversationContract[]>([]);

  const topPad = (Platform.OS === 'web' ? 0 : insets.top) + 16;

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={21} color={"#6a6767"} />
        </TouchableOpacity>
        <View pointerEvents="none" style={styles.logoCenter}>
          <View style={styles.logoRow}>
            <Image
              source={{ uri: ZOOHELP_HEADER_LOGO }}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={[styles.logoText, { color: colors.primary }]}>Helpin</Text>
          </View>
        </View>
      </View>

      <FlatList
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCenter: {
    position: 'absolute',
    left: 0,
    right: 6,
    bottom: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,

    
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  logoIcon: {
    width: 31.5,
    height: 31.5,
    borderRadius: 8,
  },
  logoText: {
    marginLeft: 2,
    top: 2,
    fontSize: 25,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -1,
    lineHeight: 31,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  listContent: { paddingTop: 4 },
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
