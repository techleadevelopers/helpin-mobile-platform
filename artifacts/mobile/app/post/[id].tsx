import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { StaticMapTiles } from '@/components/StaticMapTiles';
import { MOCK_AUTHORS, POST_TYPE_CONFIG, type Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getStoredAccessToken } from '@/services/secureSession';
import { shareZooHelpItem } from '@/services/share';
import { createZooHelpApi, mapPost } from '@/services/zoohelpApi';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type StatOverlay = 'likes' | 'comments' | null;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

const STATS: Array<{ icon: MCIcon; key: 'likes' | 'comments' | 'shares'; label: string }> = [
  { icon: 'heart-outline',          key: 'likes',    label: 'Curtidas' },
  { icon: 'comment-outline',        key: 'comments', label: 'Comentários' },
  { icon: 'share-variant-outline',  key: 'shares',   label: 'Compartilhar' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function PremiumTouchableOpacity({
  onPressIn,
  onPressOut,
  style,
  ...props
}: React.ComponentProps<typeof TouchableOpacity>) {
  const scale = React.useRef(new Animated.Value(1)).current;

  function animateScale(value: number) {
    Animated.spring(scale, {
      toValue: value,
      speed: 36,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedTouchableOpacity
      {...props}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event) => {
        animateScale(0.975);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
    />
  );
}

function DetailInfoChip({
  icon,
  text,
  color,
}: {
  icon: MCIcon;
  text: string;
  color: string;
}) {
  return (
    <View style={[styles.infoChip, { backgroundColor: color + '0A' }]}>
      <MaterialCommunityIcons name={icon} size={11} color={color} />
      <Text style={[styles.infoChipText, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

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
  const { likedPosts, toggleLike, posts } = useApp();
  const [liked, setLiked] = useState(false);
  const [remotePost, setRemotePost] = useState<Post | null>(null);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [contactOverlayOpen, setContactOverlayOpen] = useState(false);
  const [statOverlay, setStatOverlay] = useState<StatOverlay>(null);

  const post = posts.find((p) => p.id === id) ?? remotePost;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (!id || posts.some((p) => p.id === id)) return;
    createZooHelpApi()
      ?.post(id)
      .then((item) => setRemotePost(mapPost(item)))
      .catch(() => setRemotePost(null));
  }, [id, posts]);

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="paw-off" size={36} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Caso nío encontrado</Text>
      </View>
    );
  }

  const activePost = post;
  const cfg = POST_TYPE_CONFIG[post.type];
  const imageUris = Array.from(
    new Set(
      [
        ...(post.images?.length ? post.images : []),
        post.image,
      ].filter((uri): uri is string => Boolean(uri))
    )
  );
  const isLiked = likedPosts.includes(post.id) || liked;
  const contactDisplay = activePost.contact ? formatPhoneNumber(activePost.contact) : '';
  const locationDisplay = formatLocationLine(post.neighborhood, post.location);
  const timeDisplay = formatPostTime(post.createdAt);
  const breedAgeParts = [post.breed, post.age].filter(Boolean);
  const mapCoords = {
    lat: activePost.latitude ?? -23.5505,
    lng: activePost.longitude ?? -46.6333,
  };
  const statOverlayTitle = statOverlay === 'likes' ? 'Curtidas' : 'Comentarios';
  const statOverlayUsers = [
    activePost.author,
    ...MOCK_AUTHORS.filter((item) => item.id !== activePost.author.id),
  ].slice(0, statOverlay === 'comments' ? 4 : 5);

  function tapFeedback() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleLike() {
    setLiked(!isLiked);
    toggleLike(activePost.id);
    tapFeedback();
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

    const room = await createZooHelpApi(() => token)?.openChatRoom(activePost.id).catch((error) => {
      const status = typeof error?.status === 'number' ? error.status : null;
      if (status === 401) {
        Alert.alert('Sessao expirada', 'Entre novamente para abrir o chat deste caso.');
      } else {
        Alert.alert('Chat indisponivel', 'Nao foi possivel carregar o chat agora.');
      }
      return null;
    });
    if (!room) {
      return;
    }
    router.push(
      `/chat/${room.id}?postName=${encodeURIComponent(activePost.name)}&authorName=${encodeURIComponent(activePost.author.name)}&chatType=${activePost.type === 'emergency' ? 'rescue' : 'adoption'}`
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

  function handleShare() {
    tapFeedback();
    shareZooHelpItem(activePost.name, `${activePost.name} no ZooHelp: ${activePost.description}`);
  }

  function handleStatPress(key: 'likes' | 'comments' | 'shares') {
    if (key === 'shares') {
      handleShare();
      return;
    }
    tapFeedback();
    setStatOverlay(key);
  }

  const actionLabel =
    activePost.type === 'adoption' ? 'Quero adotar' :
    activePost.rescueStatus === 'resolved' ? 'Caso resolvido' :
    activePost.type === 'emergency' ? 'Ajudar agora' :
    activePost.type === 'campaign' ? 'Apoiar' :
    activePost.type === 'lost' ? 'Encontrei' : 'Contato';

  const isEmergency = activePost.type === 'emergency' || activePost.urgent;
  const isResolved = activePost.rescueStatus === 'resolved';
  const headerButtonTop = Platform.OS === 'web' ? 8 : Math.max(insets.top, 8);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={[styles.topActions, { paddingTop: headerButtonTop }]}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Author card */}
          {(() => {
            const isOrg = post.author.type === 'ong' || post.author.type === 'vet';
            const authorLabel =
              post.author.type === 'ong' ? 'ONG' :
              post.author.type === 'vet' ? 'Veterinário' : 'Protetor';
            const showsProtectorSince = !isOrg;
            return (
              <TouchableOpacity
                style={[
                  styles.authorCard,
                  {
                    backgroundColor: colors.muted + '80',
                    borderColor: isOrg ? colors.primary + '20' : 'transparent',
                    borderWidth: isOrg ? 0.5 : 0,
                  },
                ]}
                onPress={() => router.push({ pathname: '/(tabs)/user/[id]', params: { id: post.author.id } })}
                activeOpacity={0.85}
              >
                <Avatar
                  name={post.author.name}
                  size={40}
                  verified={false}
                  type={post.author.type}
                  imageUrl={post.author.avatar}
                />
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
                    {post.author.verified && (
                      <MaterialCommunityIcons name="check-decagram" size={12} color="#7B8B8B" />
                    )}
                  </View>
                  <Text style={styles.authorType}>
                    {authorLabel}
                    {showsProtectorSince && <Text style={styles.authorSince}>: Desde 05/2026</Text>}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    {
                      backgroundColor: followingAuthor ? colors.primary + '12' : colors.primary,
                      borderColor: colors.primary + '24',
                    },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    setFollowingAuthor((current) => !current);
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.followBtnText, { color: followingAuthor ? colors.primary : '#FFFFFF' }]}>
                    {followingAuthor ? 'Seguindo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })()}

          {imageUris.length > 0 && (
            <View style={styles.photoSection}>
              <View style={styles.photoBadgesOverlay}>
                <StatusBadge
                  type={post.type}
                  urgent={post.urgent && !isResolved}
                  resolved={isResolved}
                  size="sm"
                  hideType={post.type === 'post'}
                />
              </View>
              {imageUris.length === 1 && (
                <TouchableOpacity
                  style={[styles.postPhotoTile, styles.postPhotoSingle, { borderColor: colors.border }]}
                  onPress={() => setSelectedImageUri(imageUris[0])}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: imageUris[0] }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
                </TouchableOpacity>
              )}

              {imageUris.length === 2 && (
                <View style={styles.postPhotoGrid}>
                  {imageUris.map((uri, photoIndex) => (
                    <TouchableOpacity
                      key={`${uri}-${photoIndex}`}
                      style={[styles.postPhotoTile, styles.postPhotoHalf, { borderColor: colors.border }]}
                      onPress={() => setSelectedImageUri(uri)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {imageUris.length === 3 && (
                <View style={styles.postPhotoGrid}>
                  <TouchableOpacity
                    style={[styles.postPhotoTile, styles.postPhotoFeature, { borderColor: colors.border }]}
                    onPress={() => setSelectedImageUri(imageUris[0])}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: imageUris[0] }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
                  </TouchableOpacity>
                  <View style={styles.postPhotoSideStack}>
                    {imageUris.slice(1, 3).map((uri, photoIndex) => (
                      <TouchableOpacity
                        key={`${uri}-${photoIndex + 1}`}
                        style={[styles.postPhotoTile, styles.postPhotoStacked, { borderColor: colors.border }]}
                        onPress={() => setSelectedImageUri(uri)}
                        activeOpacity={0.9}
                      >
                        <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {imageUris.length >= 4 && (
                <View style={styles.postPhotoGridWrap}>
                  {imageUris.slice(0, 4).map((uri, photoIndex) => (
                    <TouchableOpacity
                      key={`${uri}-${photoIndex}`}
                      style={[styles.postPhotoTile, styles.postPhotoQuarter, { borderColor: colors.border }]}
                      onPress={() => setSelectedImageUri(uri)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
                      {photoIndex === 3 && imageUris.length > 4 && (
                        <View style={styles.postPhotoMoreOverlay}>
                          <Text style={styles.postPhotoMoreText}>+{imageUris.length - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={[styles.description, { color: colors.foreground }]}>{post.description}</Text>
              {breedAgeParts.length > 0 && (
                <View style={styles.breedAgeRow}>
                  <Text style={[styles.breedAge, { color: colors.mutedForeground }]}>
                    {breedAgeParts.join(' - ')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.titleActions}>
              <TouchableOpacity
                style={[styles.titleIconBtn, { backgroundColor: '#F8FAF7', borderColor: colors.border }]}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={17} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.titleIconBtn,
                  {
                    backgroundColor: isLiked ? '#C95A5A0F' : '#F8FAF7',
                    borderColor: isLiked ? '#C95A5A24' : colors.border,
                  },
                ]}
                onPress={handleLike}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? '#C95A5A' : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1} ellipsizeMode="tail">
              {locationDisplay}
            </Text>
            <View style={styles.feedTimeRow}>
              <Image source={{ uri: FEED_TIME_ICON }} style={styles.feedTimeIcon} contentFit="contain" />
              <Text style={[styles.feedTimeText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {timeDisplay}
              </Text>
            </View>
          </View>

          <PremiumTouchableOpacity style={styles.rescueMapCard} onPress={handleRoute} activeOpacity={0.9}>
            <View style={styles.rescueMapInfo}>
              <Text style={styles.rescueMapTitle}>Area de resgate</Text>
              <Text style={styles.rescueMapSubtitle}>Baseado na localizacao do caso</Text>
              <Text style={styles.rescueMapLink}>{'Abrir rota ->'}</Text>
            </View>
            <View style={styles.rescueMapPreview}>
              <StaticMapTiles latitude={mapCoords.lat} longitude={mapCoords.lng} zoom={13} opacity={0.92} />
              <View style={styles.mapPulseOuter}>
                <View style={styles.mapPulseInner} />
              </View>
              <View style={styles.mapSmallPin} />
            </View>
          </PremiumTouchableOpacity>

          {activePost.contact ? (
            <TouchableOpacity
              style={[
                styles.contactCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleContact}
              activeOpacity={0.85}
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.primary + '12' }]}>
                <MaterialCommunityIcons name="whatsapp" size={17} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>WhatsApp do caso</Text>
                <Text style={[styles.contactNumber, { color: colors.foreground }]}>{contactDisplay}</Text>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <PremiumTouchableOpacity
                key={stat.label}
                style={[
                  styles.statBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleStatPress(stat.key)}
                activeOpacity={0.82}
              >
                <View style={styles.statTopLine}>
                  <MaterialCommunityIcons name={stat.icon} size={15} color={colors.mutedForeground} />
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{post[stat.key]}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </PremiumTouchableOpacity>
            ))}
          </View>

          <View style={{ height: bottomPad + 80 }} />
        </View>
      </ScrollView>

      {/* Action bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 10 },
        ]}
      >
        <PremiumTouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={handleShare}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.mutedForeground} />
        </PremiumTouchableOpacity>

        <PremiumTouchableOpacity
          style={[styles.bottomChatBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={handleRoute}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="navigation-variant-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.chatBtnText, { color: colors.mutedForeground }]}>Rota</Text>
        </PremiumTouchableOpacity>

        <PremiumTouchableOpacity
          style={[styles.bottomChatBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={handleOpenChat}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="chat-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.chatBtnText, { color: colors.mutedForeground }]}>Chat</Text>
        </PremiumTouchableOpacity>

        <PremiumTouchableOpacity
          style={[
            styles.mainActionBtn,
            { backgroundColor: cfg.bgColor },
          ]}
          onPress={isEmergency ? handleOpenChat : handleContact}
          activeOpacity={0.9}
        >
          <Text style={styles.mainActionText}>{actionLabel}</Text>
        </PremiumTouchableOpacity>
      </View>

      <Modal visible={Boolean(selectedImageUri)} transparent animationType="fade" onRequestClose={() => setSelectedImageUri(null)}>
        <View style={styles.imageModal}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setSelectedImageUri(null)} activeOpacity={0.85}>
            <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImageUri && (
            <Image source={{ uri: selectedImageUri }} style={styles.imageModalPhoto} contentFit="contain" />
          )}
        </View>
      </Modal>

      <Modal transparent visible={contactOverlayOpen} animationType="fade" onRequestClose={() => setContactOverlayOpen(false)}>
        <View style={styles.contactOverlayRoot}>
          <TouchableOpacity style={styles.contactOverlayBackdrop} activeOpacity={1} onPress={() => setContactOverlayOpen(false)} />
          <View style={[styles.contactSheet, { paddingBottom: bottomPad + 16 }]}>
            <View style={styles.contactSheetHandle} />
            <View style={styles.contactSheetHeader}>
              <View style={styles.contactSheetIcon}>
                <MaterialCommunityIcons name="whatsapp" size={21} color="#2D6A4F" />
              </View>
              <TouchableOpacity style={styles.contactSheetClose} onPress={() => setContactOverlayOpen(false)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={18} color="#5F6861" />
              </TouchableOpacity>
            </View>
            <Text style={styles.contactSheetTitle}>Contato do caso</Text>
            <Text style={styles.contactSheetText}>
              Fale com gentileza, informe que viu o caso no ZooHelp e combine os detalhes com seguranca antes de se deslocar.
            </Text>
            <View style={styles.contactPhoneBox}>
              <Text style={styles.contactPhoneLabel}>WhatsApp do caso</Text>
              <Text style={styles.contactPhoneValue}>{contactDisplay || 'Indisponivel'}</Text>
            </View>
            <TouchableOpacity style={styles.contactWhatsAppBtn} onPress={handleOpenWhatsApp} activeOpacity={0.86}>
              <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.contactWhatsAppText}>Abrir WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={statOverlay !== null} animationType="fade" onRequestClose={() => setStatOverlay(null)}>
        <View style={styles.statOverlayRoot}>
          <TouchableOpacity style={styles.statOverlayBackdrop} activeOpacity={1} onPress={() => setStatOverlay(null)} />
          <View style={styles.statSheet}>
            <View style={styles.statSheetHeader}>
              <Text style={styles.statSheetTitle}>{statOverlayTitle}</Text>
              <TouchableOpacity style={styles.statSheetClose} onPress={() => setStatOverlay(null)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={15} color="#5F6861" />
              </TouchableOpacity>
            </View>
            <View style={styles.statPeopleList}>
              {statOverlayUsers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.statPersonRow}
                  onPress={() => {
                    setStatOverlay(null);
                    router.push({ pathname: '/(tabs)/user/[id]', params: { id: item.id } });
                  }}
                  activeOpacity={0.84}
                >
                  <Avatar name={item.name} size={30} verified={item.verified} type={item.type} imageUrl={item.avatar} />
                  <View style={styles.statPersonInfo}>
                    <Text style={styles.statPersonName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.statPersonMeta}>{item.type === 'ong' ? 'ONG' : item.type === 'vet' ? 'Veterinario' : 'Protetor'}</Text>
                  </View>
                  <MaterialCommunityIcons name={statOverlay === 'likes' ? 'heart-outline' : 'comment-outline'} size={14} color="#7C867C" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  shareFloatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  content: { padding: 18, paddingTop: 10, gap: 14 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  titleInfo: { flex: 1, gap: 5 },
  animalName: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -0.4,
  },
  breedAgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breedAge: { fontSize: 12, fontFamily: 'Montserrat_400Regular', opacity: 0.7 },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  titleActions: { flexDirection: 'row', gap: 6 },
  titleIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 },
  locationText: { fontSize: 12, fontFamily: 'Montserrat_400Regular', maxWidth: 150 },
  timeText: { fontSize: 11, fontFamily: 'Montserrat_400Regular', opacity: 0.6 },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeIcon: { width: 13, height: 13, opacity: 0.72 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  contactIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 10, fontFamily: 'Montserrat_500Medium' },
  contactNumber: { fontSize: 13, fontFamily: 'Montserrat_700Bold' },

  infoChipsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  infoChipText: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },

  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 13,
    elevation: 2,
  },
  authorInfo: { flex: 1, gap: 2 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  authorName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  authorType: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  authorSince: { fontFamily: 'Montserrat_400Regular', color: '#7C867C' },
  followBtn: {
    minWidth: 58,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  followBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },

  section: { gap: 6 },
  aboutSection: { marginTop: -6, padding: 14, borderRadius: 18, borderWidth: 0.5 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -0.3,
  },
  description: { fontSize: 12, fontFamily: 'Montserrat_400Regular', lineHeight: 18, opacity: 0.85 },

  photoSection: {
    marginTop: -2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  photoBadgesOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  postPhotoGrid: { flexDirection: 'row', gap: 8 },
  postPhotoGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postPhotoTile: {
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#E8ECF0',
  },
  postPhotoSingle: { width: '100%', height: 190 },
  postPhotoHalf: { flex: 1, height: 126 },
  postPhotoFeature: { flex: 1.35, height: 170 },
  postPhotoSideStack: { flex: 1, gap: 8 },
  postPhotoStacked: { height: 81 },
  postPhotoQuarter: { width: '48.8%', height: 112 },
  postPhotoThumb: { width: '100%', height: '100%' },
  postPhotoMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  postPhotoMoreText: { fontSize: 22, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 48,
    right: 18,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageModalPhoto: { width: SCREEN_WIDTH, height: '78%' },
  contactOverlayRoot: { flex: 1, justifyContent: 'flex-end' },
  contactOverlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,22,0.28)' },
  contactSheet: {
    marginHorizontal: 10,
    marginBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE7',
  },
  contactSheetHandle: { alignSelf: 'center', width: 34, height: 4, borderRadius: 2, backgroundColor: '#DDE5DF', marginBottom: 14 },
  contactSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  contactSheetIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3EC' },
  contactSheetClose: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F3' },
  contactSheetTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  contactSheetText: { marginTop: 6, fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#5E6962', lineHeight: 18 },
  contactPhoneBox: { marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E8EDE8' },
  contactPhoneLabel: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },
  contactPhoneValue: { marginTop: 2, fontSize: 17, fontFamily: 'Montserrat_700Bold', color: '#102018' },
  contactWhatsAppBtn: { marginTop: 12, height: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D6A4F' },
  contactWhatsAppText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  statOverlayRoot: { flex: 1, justifyContent: 'flex-end' },
  statOverlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,22,0.18)' },
  statSheet: {
    marginHorizontal: 14,
    marginBottom: 88,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE7',
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  statSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statSheetTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  statSheetClose: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F3' },
  statPeopleList: { gap: 6 },
  statPersonRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderRadius: 14, backgroundColor: '#F8FAF7' },
  statPersonInfo: { flex: 1 },
  statPersonName: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  statPersonMeta: { marginTop: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },

  statsRow: { flexDirection: 'row', gap: 7 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 15,
    gap: 2,
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.075,
    shadowRadius: 12,
    elevation: 2,
  },
  statTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statValue: { fontSize: 13, fontFamily: 'Montserrat_700Bold', lineHeight: 15 },
  statLabel: { fontSize: 8, fontFamily: 'Montserrat_600SemiBold', textAlign: 'center', lineHeight: 10 },

  rescueMapCard: {
    height: 96,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E3EAE5',
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 17,
    elevation: 3,
  },
  rescueMapInfo: { width: 138, padding: 15, gap: 3, zIndex: 2 },
  rescueMapTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  rescueMapSubtitle: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: '#9AA19A', lineHeight: 13 },
  rescueMapLink: { marginTop: 7, fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  rescueMapPreview: { flex: 1, backgroundColor: '#F2F3F0', position: 'relative' },
  mapPulseOuter: {
    position: 'absolute',
    left: '45%',
    top: '44%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,90,140,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPulseInner: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FF5A8C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  mapSmallPin: {
    position: 'absolute',
    right: 20,
    top: 30,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#76A7FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  errorText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', marginTop: 10 },

  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    shadowColor: '#14261B',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 10,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  mainActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#314339',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
  },
  mainActionText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bottomChatBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  chatBtnText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
});
