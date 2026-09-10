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

import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import {
  PostAuthorCard,
  PostContactSheet,
  PostImageModal,
} from '@/components/post';
import { UserBottomNav } from '@/components/UserBottomNav';
import type { Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getStoredAccessToken } from '@/services/secureSession';
import { createZooHelpApi, geocodeAddress, geocodeStructuredAddress, mapPost } from '@/services/zoohelpApi';

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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .toLowerCase();
}

function cityStateKey(city: string, state: string) {
  const normalizedCity = normalizeLocationPart(city);
  const normalizedState = normalizeLocationPart(state).toUpperCase();
  if (!normalizedCity || !/^[A-Z]{2}$/.test(normalizedState)) return null;
  return `${normalizedCity}-${normalizedState}`;
}

function cityStateKeyFromPart(value: string) {
  const normalized = normalizeLocationPart(value);
  const match = normalized.match(/^(.+?)\s*-\s*([a-z]{2})$/i);
  if (!match) return null;
  return cityStateKey(match[1], match[2]);
}

function collapseRepeatedAddress(value: string) {
  const locationParts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (locationParts.length % 2 === 0) {
    const half = locationParts.length / 2;
    const firstHalf = locationParts.slice(0, half).map(normalizeLocationPart).join('|');
    const secondHalf = locationParts.slice(half).map(normalizeLocationPart).join('|');
    if (firstHalf === secondHalf) {
      return locationParts.slice(0, half);
    }
  }

  return locationParts;
}

function formatLocationLine(neighborhood: string, location: string) {
  const locationParts = collapseRepeatedAddress(location);
  const collapsedLocation = locationParts.join(', ');
  const normalizedLocation = normalizeLocationPart(collapsedLocation);
  const normalizedNeighborhood = normalizeLocationPart(neighborhood);
  if (normalizedNeighborhood && normalizedNeighborhood === normalizedLocation) {
    return collapsedLocation;
  }

  const alreadyHasNeighborhood = Boolean(
    normalizedNeighborhood &&
      locationParts.some((part) => normalizeLocationPart(part) === normalizedNeighborhood)
  );
  const parts = [
    ...(!alreadyHasNeighborhood && neighborhood.trim() ? [neighborhood.trim()] : []),
    ...locationParts,
  ];
  const seen = new Set<string>();
  const seenCityStates = new Set<string>();
  const output: string[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const normalized = normalizeLocationPart(part);
    if (!normalized || seen.has(normalized)) continue;

    const nextPart = parts[index + 1];
    const splitCityStateKey = nextPart ? cityStateKey(part, nextPart) : null;
    if (splitCityStateKey && seenCityStates.has(splitCityStateKey)) {
      seen.add(normalized);
      seen.add(normalizeLocationPart(nextPart));
      index += 1;
      continue;
    }

    const compactCityStateKey = cityStateKeyFromPart(part);
    if (compactCityStateKey) seenCityStates.add(compactCityStateKey);

    seen.add(normalized);
    output.push(part);
  }

  return output.join(', ');
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, user } = useApp();
  const [remotePost, setRemotePost] = useState<Post | null>(null);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [contactOverlayOpen, setContactOverlayOpen] = useState(false);
  const [resolvedMapCoords, setResolvedMapCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // This map exists only on the post-detail screen. Prefer the complete
  // address supplied at publication time so its pin is useful even when the
  // saved post coordinates are approximate.
  useEffect(() => {
    let cancelled = false;
    const address = post?.locationAddress;

    async function resolveDetailMapLocation() {
      let result: { latitude: number; longitude: number } | null = null;
      if (address?.street && address.number && address.city && address.state) {
        result = await geocodeStructuredAddress({
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        });
      }

      if (!result) {
        const fallbackAddress = [
          address?.street,
          address?.number,
          address?.neighborhood,
          address?.city,
          address?.state,
        ].filter(Boolean).join(', ') || post?.location || post?.neighborhood;
        result = fallbackAddress ? await geocodeAddress(fallbackAddress) : null;
      }

      if (!result && post?.latitude != null && post.longitude != null) {
        result = { latitude: post.latitude, longitude: post.longitude };
      }

      if (!cancelled) {
        setResolvedMapCoords(result ? { lat: result.latitude, lng: result.longitude } : null);
      }
    }

    void resolveDetailMapLocation();
    return () => { cancelled = true; };
  }, [
    post?.id,
    post?.location,
    post?.neighborhood,
    post?.latitude,
    post?.longitude,
    post?.locationAddress?.street,
    post?.locationAddress?.number,
    post?.locationAddress?.neighborhood,
    post?.locationAddress?.city,
    post?.locationAddress?.state,
  ]);

  if (!post) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="paw-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Caso nío encontrado</Text>
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
  const mapCoords = resolvedMapCoords ?? {
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
    const rooms = await api?.chatRooms().catch(() => null);
    const existingRoom = rooms?.find((item) => item.participant.id === activePost.author.id);
    const room = existingRoom ?? await api?.openDirectChat(activePost.author.id).catch((error) => {
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
    const label = encodeURIComponent(activePost.name || 'Caso Helpin');
    const destination = mapCoords
      ? `${mapCoords.lat},${mapCoords.lng}`
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
    <View style={[styles.container, { backgroundColor: '#f5f7f200' }]}>
      <ZooHelpHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={styles.content}>
          <PostAuthorCard
            post={post}
            colors={colors}
            followingAuthor={followingAuthor}
            isOwnPost={user?.id === post.author.id}
            imageUris={imageUris}
            isResolved={isResolved}
            breedAgeParts={breedAgeParts}
            locationDisplay={locationDisplay}
            timeDisplay={timeDisplay}
            contactDisplay={contactDisplay}
            mapLatitude={mapCoords.lat}
            mapLongitude={mapCoords.lng}
            onPressAuthor={() => router.push({ pathname: '/(tabs)/user/[id]', params: { id: post.author.id } })}
            onToggleFollowing={() => setFollowingAuthor((current) => !current)}
            onPressRoute={handleRoute}
            onSelectImage={setSelectedImageUri}
            onPressMessage={handleOpenChat}
            onPressContact={handleContact}
          />

          {activePost.rescueFinalReport?.publicUpdate && (
            <View style={styles.resolutionPanel}>
              <View style={styles.resolutionIcon}>
                <MaterialCommunityIcons name="check-decagram-outline" size={17} color="#2E6B4F" />
              </View>
              <View style={styles.resolutionBody}>
                <Text style={styles.resolutionLabel}>Atualizacao do resgate</Text>
                <Text style={styles.resolutionText}>{activePost.rescueFinalReport.publicUpdate}</Text>
              </View>
            </View>
          )}

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
  container: { flex: 1, backgroundColor: '#f5f7f200' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 14, paddingTop: 12, gap: 12,  },
  resolutionPanel: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E8DE',
    backgroundColor: '#EFF7F2',
  },
  resolutionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  resolutionBody: { flex: 1, gap: 3 },
  resolutionLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#2E6B4F',
  },
  resolutionText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Montserrat_500Medium',
    color: '#2F4D3E',
  },
  errorText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', marginTop: 10 },
  bottomNavHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
