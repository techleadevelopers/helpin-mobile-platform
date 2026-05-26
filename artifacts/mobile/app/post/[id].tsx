import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PostActionsRow,
  PostAuthorCard,
  PostContactSheet,
  PostImageModal,
  PostMapCard,
} from '@/components/post';
import { UserBottomNav } from '@/components/UserBottomNav';
import type { Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi, mapPost } from '@/services/zoohelpApi';

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function formatPostTime(value: string) {
  if (!value) return 'agora';
  if (!value.includes('T')) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'agora';

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} d`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function normalizeLocationPart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .toLowerCase();
}

function formatLocationLine(neighborhood: string, location: string) {
  const parts = [neighborhood, location]
    .map((part) => part.trim())
    .filter(Boolean);

  return parts
    .filter((part, index) => {
      const current = normalizeLocationPart(part);
      return !parts.some((other, otherIndex) => {
        if (otherIndex >= index) return false;
        const previous = normalizeLocationPart(other);
        return previous === current || previous.includes(current) || current.includes(previous);
      });
    })
    .join(', ');
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts } = useApp();
  const [remotePost, setRemotePost] = useState<Post | null>(null);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [contactOverlayOpen, setContactOverlayOpen] = useState(false);

  const cachedPost = posts.find((item) => item.id === id) ?? null;
  const post = remotePost ?? cachedPost;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;
    createZooHelpApi()
      ?.post(id)
      .then((item) => setRemotePost(mapPost(item)))
      .catch(() => setRemotePost(null));
  }, [id]);

  if (!post) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="paw-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Caso nÃ­o encontrado</Text>
      </View>
    );
  }

  const activePost = post;
  const imageUris = Array.from(
    new Set(
      [
        ...(post.images?.length ? post.images : []),
        post.image,
      ].filter((uri): uri is string => Boolean(uri))
    )
  );
  const contactDisplay = activePost.contact ? formatPhoneNumber(activePost.contact) : '';
  const locationDisplay = formatLocationLine(post.neighborhood, post.location);
  const timeDisplay = formatPostTime(post.createdAt);
  const breedAgeParts = [post.breed, post.age].filter(Boolean);
  const mapCoords = {
    lat: activePost.latitude ?? -23.5505,
    lng: activePost.longitude ?? -46.6333,
  };
  const isResolved = activePost.rescueStatus === 'resolved';

  function tapFeedback() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleContact() {
    tapFeedback();
    if (!activePost.contact) {
      Alert.alert('Contato', 'Entre em contato pelo chat do aplicativo.');
      return;
    }
    setContactOverlayOpen(true);
  }

  function handleOpenWhatsApp() {
    if (!activePost.contact) return;
    const phone = activePost.contact.replace(/\D/g, '');
    const whatsappPhone = phone.startsWith('55') ? phone : `55${phone}`;
    Linking.openURL(`https://wa.me/${whatsappPhone}`).catch(() => {
      Linking.openURL(`tel:${activePost.contact}`);
    });
  }

  async function handleOpenChat() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const token = await getStoredAccessToken();
    if (!token) {
      Alert.alert('Entrar para conversar', 'Faca login para abrir o chat deste caso.');
      return;
    }

    const api = createZooHelpApi(() => token);
    const rooms = await api?.chatRooms({ postId: activePost.id }).catch(() => null);
    const room = rooms?.[0] ?? await api?.openChatRoom(activePost.id).catch((error) => {
      const status = typeof error?.status === 'number' ? error.status : null;
      if (status === 401) {
        Alert.alert('Sessao expirada', 'Entre novamente para conversar com esta pessoa.');
      } else {
        Alert.alert('Chat indisponivel', 'Nao foi possivel carregar o chat agora.');
      }
      return null;
    });
    if (!room) return;

    router.push(
      `/chat/${room.id}?postName=${encodeURIComponent(activePost.name)}&authorName=${encodeURIComponent(activePost.author.name)}`
    );
  }

  function handleRoute() {
    tapFeedback();
    const label = encodeURIComponent(activePost.name || 'Caso ZooHelp');
    const hasCoords = activePost.latitude != null && activePost.longitude != null;
    const destination = hasCoords
      ? `${activePost.latitude},${activePost.longitude}`
      : encodeURIComponent(locationDisplay || activePost.location || activePost.neighborhood || activePost.name);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&q=${label}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Rota indisponivel', 'Nao foi possivel abrir o mapa agora.');
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <PostAuthorCard
            post={post}
            colors={colors}
            followingAuthor={followingAuthor}
            imageUris={imageUris}
            isResolved={isResolved}
            breedAgeParts={breedAgeParts}
            locationDisplay={locationDisplay}
            timeDisplay={timeDisplay}
            contactDisplay={contactDisplay}
            onPressAuthor={() => router.push({ pathname: '/(tabs)/user/[id]', params: { id: post.author.id } })}
            onToggleFollowing={() => setFollowingAuthor((current) => !current)}
            onPressTrust={() => Alert.alert('Protecao ativa', 'A ZooHelp usa sinais do perfil, contexto e localizacao para ajudar a coordenar respostas mais seguras.')}
            onSelectImage={setSelectedImageUri}
            onPressMessage={handleOpenChat}
            onPressContact={handleContact}
          />

          <PostMapCard latitude={mapCoords.lat} longitude={mapCoords.lng} onPress={handleRoute} />

          <PostActionsRow onRoute={handleRoute} onChat={handleOpenChat} onContact={handleContact} />

          <View style={{ height: bottomPad + 92 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomNavHost}>
        <UserBottomNav />
      </View>

      <PostImageModal
        selectedImageUri={selectedImageUri}
        authorName={activePost.author.name}
        authorAvatar={activePost.author.avatar}
        onClose={() => setSelectedImageUri(null)}
      />

      <PostContactSheet
        visible={contactOverlayOpen}
        bottomPad={bottomPad}
        contactDisplay={contactDisplay}
        onClose={() => setContactOverlayOpen(false)}
        onOpenWhatsApp={handleOpenWhatsApp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 18, paddingTop: 1, gap: 14, bottom: 12, },
  errorText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', marginTop: 10 },
  bottomNavHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
