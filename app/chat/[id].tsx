import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState as NativeAppState,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { connectChatRoom, type ChatRealtimeStatus } from '@/services/chatRealtime';
import { formatChatMessageTime } from '@/services/timeFormat';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { ChatConversationContract } from '@/services/zoohelpEngine';

// Ícone do relógio (mesmo do feed)
const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  status?: 'sending' | 'sent' | 'failed';
  idempotencyKey?: string;
}

export default function ChatRoomScreen() {
  const { id, postName, authorName, chatType } = useLocalSearchParams<{
    id: string;
    postName?: string;
    authorName?: string;
    chatType?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshChatState } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<ChatConversationContract | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ChatRealtimeStatus>('connecting');
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(user?.id ?? null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);

  const participant = room?.participant ?? (authorName ? { name: authorName, verified: false } : null);
  const isAdoptionChat = chatType === 'adoption' && !!postName;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? 8 : Math.max(insets.top, 8);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [message, ...prev];
    });
  }, []);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const acknowledgeMessage = useCallback((messageId?: string) => {
    if (!id || !messageId || NativeAppState.currentState !== 'active') return;
    createZooHelpApi()?.markChatRoomRead(id, messageId)
      .then(() => refreshChatState().catch(() => {}))
      .catch(() => {});
  }, [id, refreshChatState]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const api = createZooHelpApi();

    Promise.all([
      api?.me().catch(() => null),
      api?.chatRoom(id).catch(() => null),
      api?.chatMessages(id, { limit: 50 }).catch(() => []),
    ]).then(([currentUser, loadedRoom, items]) => {
      if (!mounted) return;
      const nextUserId = currentUser?.user.id ?? user?.id ?? null;
      setCurrentUserId(nextUserId);
      currentUserIdRef.current = nextUserId;
      if (loadedRoom) setRoom(loadedRoom);
      setHasOlderMessages((items ?? []).length === 50);
      setMessages((items ?? []).map((item) => ({
        id: item.id,
        text: item.body,
        sender: item.senderId === nextUserId ? 'me' : 'other',
        time: item.createdAt,
        status: 'sent',
      })));
      acknowledgeMessage(items?.[0]?.id);
    });

    const realtime = connectChatRoom(id, {
      onStatus: setConnectionStatus,
      onMessage: (event) => {
        appendMessage({
          id: event.messageId,
          text: event.body,
          sender: event.senderId === (currentUserIdRef.current ?? user?.id) ? 'me' : 'other',
          time: event.createdAt,
          status: 'sent',
        });
        acknowledgeMessage(event.messageId);
      },
    });

    return () => {
      mounted = false;
      realtime.close();
    };
  }, [acknowledgeMessage, appendMessage, id, user?.id]);

  function sendMessage(bodyOverride?: string, requestIdOverride?: string, tempIdOverride?: string) {
    const body = bodyOverride ?? text.trim();
    if (!body || !id) return;
    const now = new Date();
    const tempId = tempIdOverride ?? `local-${Date.now()}`;
    const idempotencyKey = requestIdOverride ?? `mobile-chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const newMsg: Message = {
      id: tempId,
      text: body,
      sender: 'me',
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
      status: 'sending',
      idempotencyKey,
    };
    setMessages((prev) => tempIdOverride
      ? prev.map((item) => item.id === tempId ? newMsg : item)
      : [newMsg, ...prev]);
    if (!bodyOverride) setText('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    createZooHelpApi()
      ?.sendChatMessage(id, body, idempotencyKey)
      .then((response) => {
        refreshChatState().catch(() => {});
        setMessages((prev) => {
          if (prev.some((item) => item.id === response.message.id)) {
            return prev.filter((item) => item.id !== tempId);
          }
          return prev.map((item) => (
            item.id === tempId
              ? {
                  id: response.message.id,
                  text: response.message.body,
                  sender: 'me',
                  time: response.message.createdAt,
                  status: 'sent',
                }
              : item
          ));
        });
      })
      .catch(() => {
        setMessages((prev) => prev.map((item) => (
          item.id === tempId ? { ...item, status: 'failed' } : item
        )));
      });
  }

  async function loadOlderMessages() {
    if (!id || loadingOlderMessages || !hasOlderMessages || messages.length === 0) return;
    setLoadingOlderMessages(true);
    const cursor = messages[messages.length - 1]?.id;
    const items = await createZooHelpApi()?.chatMessages(id, { before: cursor, limit: 50 }).catch(() => []);
    setMessages((prev) => [
      ...prev,
      ...(items ?? [])
        .filter((item) => !prev.some((existing) => existing.id === item.id))
        .map((item) => ({
          id: item.id,
          text: item.body,
          sender: item.senderId === currentUserIdRef.current ? 'me' as const : 'other' as const,
          time: item.createdAt,
          status: 'sent' as const,
        })),
    ]);
    setHasOlderMessages((items ?? []).length === 50);
    setLoadingOlderMessages(false);
  }

  function handleOptions() {
    if (!room) return;
    Alert.alert(
      'Opcoes do chat',
      'Bloquear impede novas mensagens entre as contas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear contato',
          style: 'destructive',
          onPress: () => {
            createZooHelpApi()?.blockChatParticipant(room.participant.id)
              .then(() => {
                Alert.alert('Contato bloqueado', 'Novas mensagens deste contato foram bloqueadas.');
                router.back();
              })
              .catch(() => Alert.alert('Erro', 'Nao foi possivel bloquear este contato agora.'));
          },
        },
      ],
    );
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.sender === 'me';
    const displayTime = formatChatMessageTime(item.time);

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && participant && <Avatar name={participant.name} size={28} imageUrl={'avatar' in participant ? participant.avatar : null} />}
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: '#EAF3EC', borderColor: '#D6E5DA' }]
              : [styles.bubbleOther, { backgroundColor: '#FFFFFF', borderColor: '#E8EDE8' }],
          ]}
        >
          <Text style={[styles.bubbleText, { color: colors.foreground }]}>
            {item.text}
          </Text>

          {/* Time row with icon - EXACTLY like PostCard feedTimeRow */}
          <View style={styles.feedTimeRow}>
            <Image source={{ uri: FEED_TIME_ICON }} style={styles.feedTimeIcon}  />
            <Text style={[styles.feedTimeText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.status === 'sending' ? 'enviando' : item.status === 'failed' ? 'falhou' : displayTime}
            </Text>
            {item.status === 'failed' && (
              <TouchableOpacity onPress={() => sendMessage(item.text, item.idempotencyKey, item.id)} activeOpacity={0.8}>
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  const hasText = text.trim().length > 0;
  const connectionLabel =
    connectionStatus === 'connected'
      ? 'Conectado'
      : connectionStatus === 'reconnecting'
        ? 'Reconectando'
        : 'Conectando';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F5F7F2' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: '#F5F7F2', borderBottomColor: '#E4EAE5', paddingTop: topPad },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && (
          <Avatar
            name={participant.name}
            size={36}
            verified={participant.verified}
            imageUrl={'avatar' in participant ? participant.avatar : null}
          />
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {participant?.name ?? 'Chat'}
          </Text>
          <Text style={[styles.headerPost, { color: colors.primary }]} numberOfLines={1}>
            {room?.postTitle ?? (postName ? decodeURIComponent(postName) : 'Conversa Helpin')}
          </Text>
          <Text style={[styles.connectionText, { color: connectionStatus === 'connected' ? '#2D6A4F' : colors.mutedForeground }]}>
            {connectionLabel}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleOptions}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isAdoptionChat && (
        <View style={styles.adoptionBanner}>
          <View style={styles.adoptionBannerIcon}>
            <MaterialCommunityIcons name="home-heart" size={15} color="#2D6A4F" />
          </View>
          <View style={styles.adoptionBannerInfo}>
            <Text style={styles.adoptionBannerTitle}>Pedido de adoção</Text>
            <Text style={[styles.adoptionBannerPost, { color: colors.mutedForeground }]} numberOfLines={1}>
              {postName ? decodeURIComponent(postName) : room?.postTitle}
            </Text>
          </View>
          <View style={styles.adoptionBannerMark}>
            <MaterialCommunityIcons name="paw" size={14} color="#8FB69B" />
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={[styles.msgList, { paddingBottom: 12 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!!messages.length}
        ListEmptyComponent={
          <View style={[styles.emptyChatWrap, { opacity: 0.62 }]}>
            <MaterialCommunityIcons name="chat-outline" size={38} color={colors.mutedForeground} />
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
              Nenhuma mensagem ainda
            </Text>
          </View>
        }
        ListFooterComponent={hasOlderMessages ? (
          <TouchableOpacity style={styles.loadOlderButton} onPress={loadOlderMessages} disabled={loadingOlderMessages}>
            <Text style={styles.loadOlderText}>{loadingOlderMessages ? 'Carregando...' : 'Carregar mensagens anteriores'}</Text>
          </TouchableOpacity>
        ) : null}
      />

      <View
        style={[
          styles.inputBar,
          { backgroundColor: '#F5F7F2', borderTopColor: '#E4EAE5', paddingBottom: bottomPad + 8 },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: hasText ? colors.primary : colors.muted,
              borderColor: hasText ? colors.primary + '40' : 'transparent',
              shadowColor: hasText ? colors.primary : 'transparent',
            },
          ]}
          onPress={() => sendMessage()}
          activeOpacity={0.85}
          disabled={!hasText}
        >
          <MaterialCommunityIcons
            name="send"
            size={19}
            color={hasText ? '#FFFFFF' : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: 'Montserrat_700Bold' },
  headerPost: { fontSize: 11, fontFamily: 'Montserrat_500Medium', marginTop: 1 },
  connectionText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', marginTop: 2 },
  msgList: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
  msgRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowOther: { alignSelf: 'flex-start' },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
    maxWidth: 260,
    borderWidth: 1,
    shadowColor: '#244C35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bubbleMe: {
    borderBottomRightRadius: 7,
  },
  bubbleOther: { borderBottomLeftRadius: 7 },
  bubbleText: { fontSize: 15, fontFamily: 'Montserrat_500Medium', lineHeight: 22 },

  // Estilos do relógio (exatamente iguais ao PostCard)
  feedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  feedTimeIcon: {
    width: 13,
    height: 13,
    opacity: 0.72
  },
  feedTimeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold'
  },
  retryText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F', marginLeft: 7 },
  loadOlderButton: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  loadOlderText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },

  adoptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#F6FAF6',
    borderColor: '#DDECE1',
  },
  adoptionBannerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3EA',
  },
  adoptionBannerInfo: { flex: 1 },
  adoptionBannerTitle: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  adoptionBannerPost: { fontSize: 13, fontFamily: 'Montserrat_500Medium', marginTop: 1 },
  adoptionBannerMark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF6F0' },
  emptyChatWrap: {
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 22,
    gap: 9,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: { fontSize: 13, fontFamily: 'Montserrat_500Medium' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  input: { fontSize: 15, fontFamily: 'Montserrat_500Medium' },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
});
