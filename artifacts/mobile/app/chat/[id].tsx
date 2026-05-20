import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { MOCK_CONVERSATIONS } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { createZooHelpApi } from '@/services/zoohelpApi';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1', text: 'Olá! Vi o post da Mel. Ela é muito linda!', sender: 'other', time: '14:28' },
    { id: 'm2', text: 'Sim! A Mel é uma fofa. Você tem interesse em adotá-la?', sender: 'me', time: '14:29' },
    { id: 'm3', text: 'Tenho sim! Moro em apartamento, isso seria problema?', sender: 'other', time: '14:31' },
    { id: 'm4', text: 'Nío! Ela se adapta bem. Precisamos conversar sobre o processo de adoçío.', sender: 'me', time: '14:32' },
    { id: 'm5', text: 'Olá! Tenho interesse em adotar a Mel. Podemos conversar?', sender: 'other', time: '14:32' },
  ],
  c2: [
    { id: 'm1', text: 'Vi o post do Thor! Acho que o vi no parque hoje cedo.', sender: 'other', time: '12:15' },
    { id: 'm2', text: 'Sério?! Onde exatamente? Ele sumiu ontem à tarde.', sender: 'me', time: '12:16' },
    { id: 'm3', text: 'Perto do lago do Ibirapuera. Era um Golden com coleira azul?', sender: 'other', time: '12:17' },
  ],
  c3: [
    { id: 'm1', text: 'Quero contribuir com raçío. Como faço?', sender: 'other', time: 'Ontem' },
    { id: 'm2', text: 'Que gentileza! Pode trazer diretamente ao abrigo ou transferir via PIX.', sender: 'me', time: 'Ontem' },
  ],
};

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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES[id as string] ?? []);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);
  const participant = conversation?.participant ?? (authorName ? { name: authorName, verified: false } : null);
  const isAdoptionChat = chatType === 'adoption' && !!postName;

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  React.useEffect(() => {
    if (!id) return;
    createZooHelpApi()
      ?.chatMessages(id)
      .then((items) => {
        setMessages(items.map((item) => ({
          id: item.id,
          text: item.body,
          sender: item.senderId === 'me' || item.senderId === user?.id ? 'me' as const : 'other' as const,
          time: item.createdAt,
        })).reverse());
      })
      .catch(() => {});
  }, [id, user?.id]);

  function sendMessage() {
    if (!text.trim()) return;
    const now = new Date();
    const newMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'me',
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
    setMessages((prev) => [newMsg, ...prev]);
    createZooHelpApi()?.sendChatMessage(id as string, newMsg.text).catch(() => {});
    setText('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && participant && <Avatar name={participant.name} size={28} />}
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
            {item.time}
          </Text>
        </View>
      </View>
    );
  }

  const hasText = text.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topPad + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        {participant && <Avatar name={participant.name} size={36} verified={participant.verified} />}
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {participant?.name ?? 'Chat'}
          </Text>
          {conversation?.postTitle && (
            <Text style={[styles.headerPost, { color: colors.primary }]} numberOfLines={1}>
              {conversation.postTitle}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Opções do chat', 'Denunciar, bloquear e arquivar serío integrados à moderaçío.')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Adoption context banner */}
      {isAdoptionChat && (
        <View style={[styles.adoptionBanner, { backgroundColor: '#4CAF5010', borderColor: '#4CAF5030' }]}>
          <View style={[styles.adoptionBannerIcon, { backgroundColor: '#4CAF5020' }]}>
            <MaterialCommunityIcons name="home-heart" size={16} color="#4CAF50" />  
          </View>
          <View style={styles.adoptionBannerInfo}>
            <Text style={[styles.adoptionBannerTitle, { color: '#4CAF50' }]}>Pedido de adoçío</Text>
            <Text style={[styles.adoptionBannerPost, { color: colors.mutedForeground }]} numberOfLines={1}>
              {decodeURIComponent(postName as string)}
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
          isAdoptionChat ? (
            <View style={styles.emptyChatWrap}>
              <MaterialCommunityIcons name="chat-outline" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                Inicie a conversa sobre a adoçío
              </Text>
            </View>
          ) : null
        }
      />

      {/* Input bar */}
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
  adoptionBannerTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
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
