import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
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

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  status?: 'sending' | 'sent' | 'failed';
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
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<ChatConversationContract | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ChatRealtimeStatus>('connecting');
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

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
    if (!id) return;
    let mounted = true;
    const api = createZooHelpApi();

    Promise.all([
      api?.chatRoom(id).catch(() => null),
      api?.chatMessages(id).catch(() => []),
    ]).then(([loadedRoom, items]) => {
      if (!mounted) return;
      if (loadedRoom) setRoom(loadedRoom);
      setMessages((items ?? []).map((item) => ({
        id: item.id,
        text: item.body,
        sender: item.senderId === user?.id ? 'me' : 'other',
        time: item.createdAt,
        status: 'sent',
      })));
    });

    const realtime = connectChatRoom(id, {
      onStatus: setConnectionStatus,
      onMessage: (event) => {
        appendMessage({
          id: event.messageId,
          text: event.body,
          sender: event.senderId === user?.id ? 'me' : 'other',
          time: event.createdAt,
          status: 'sent',
        });
      },
    });

    return () => {
      mounted = false;
      realtime.close();
    };
  }, [appendMessage, id, user?.id]);

  function sendMessage() {
    const body = text.trim();
    if (!body || !id) return;
    const now = new Date();
    const tempId = `local-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      text: body,
      sender: 'me',
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
      status: 'sending',
    };
    setMessages((prev) => [newMsg, ...prev]);
    setText('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    createZooHelpApi()
      ?.sendChatMessage(id, body)
      .then((response) => {
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

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && participant && <Avatar name={participant.name} size={28} imageUrl={'avatar' in participant ? participant.avatar : null} />}
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: colors.primary, shadowColor: colors.primary }]
              : [styles.bubbleOther, { backgroundColor: colors.card }],
          ]}
        >
          <Text style={[styles.bubbleText, { color: isMe ? '#FFFFFF' : colors.foreground }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
            {item.status === 'sending' ? 'enviando' : item.status === 'failed' ? 'falhou' : formatChatMessageTime(item.time)}
          </Text>
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad },
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
            {room?.postTitle ?? (postName ? decodeURIComponent(postName) : 'Conversa ZooHelp')}
          </Text>
          <Text style={[styles.connectionText, { color: connectionStatus === 'connected' ? '#2D6A4F' : colors.mutedForeground }]}>
            {connectionLabel}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Opcoes do chat', 'Denuncia e bloqueio usam a fila de moderacao do backend.')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {isAdoptionChat && (
        <View style={[styles.adoptionBanner, { backgroundColor: '#4CAF5010', borderColor: '#4CAF5030' }]}>
          <View style={[styles.adoptionBannerIcon, { backgroundColor: '#4CAF5020' }]}>
            <MaterialCommunityIcons name="home-heart" size={16} color="#4CAF50" />
          </View>
          <View style={styles.adoptionBannerInfo}>
            <Text style={[styles.adoptionBannerTitle, { color: '#4CAF50' }]}>Pedido de adocao</Text>
            <Text style={[styles.adoptionBannerPost, { color: colors.mutedForeground }]} numberOfLines={1}>
              {postName ? decodeURIComponent(postName) : room?.postTitle}
            </Text>
          </View>
          <MaterialCommunityIcons name="paw" size={18} color="#4CAF5060" />
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
          <View style={styles.emptyChatWrap}>
            <MaterialCommunityIcons name="chat-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
              Nenhuma mensagem ainda
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 8 },
        ]}
      >
        <View style={[styles.inputWrapper, { backgroundColor: colors.muted }]}>
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
          onPress={sendMessage}
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
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  headerPost: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  connectionText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  msgList: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
  msgRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowOther: { alignSelf: 'flex-start' },
  bubble: {
    padding: 12,
    borderRadius: 18,
    gap: 4,
    maxWidth: 260,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  bubbleTime: { fontSize: 10, fontFamily: 'Inter_400Regular', alignSelf: 'flex-end' },
  adoptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  adoptionBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adoptionBannerInfo: { flex: 1 },
  adoptionBannerTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  adoptionBannerPost: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 1 },
  emptyChatWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
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
  },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular' },
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
