import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { OperationalStatus } from '@/components/OperationalStatus';
import { StaticMapTiles } from '@/components/StaticMapTiles';
import { StatusBadge } from '@/components/StatusBadge';
import { Post, RescueOperationalSummary } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { formatDistanceKm } from '@/services/geoDistance';
import { shareZooHelpItem } from '@/services/share';
import { ZooHelpApiError, type PostCommentContract } from '@/services/zoohelpEngine';
import { createZooHelpApi, geocodeAddress, geocodeStructuredAddress } from '@/services/zoohelpApi';

const CARD_IMAGE_HEIGHT = 330;
const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';
const DEFAULT_MAP_COORDS = { latitude: -23.5505, longitude: -46.6333 };

const ANIMAL_PLACEHOLDERS: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=700&q=85',
  cat: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=700&q=85',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=700&q=85',
};

const CTA_LABELS: Record<string, string> = {
  adoption:  'Quero adotar ',
  emergency: 'Ajudar agora',
  campaign:  'Apoiar campanha',
  lost:      'Vi esse pet ',
  found:     'Entrar em contato',
};

const CTA_COLORS: Record<string, string> = {
  adoption:  '#4CAF50',
  emergency: '#D97863',
  campaign:  '#9B59B6',
  lost:      '#FF9800',
  found:     '#2F80ED',
};

const PREMIUM_SHADOW = Platform.select({
  ios: {
    shadowColor: 'rgba(15,23,42,0.16)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  android: {
    elevation: 0,
  },
  default: {
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
});

interface PostCardProps {
  post: Post;
  index?: number;
}

function formatPostTime(value: string) {
  if (!value) return 'agora';
  if (!value.includes('T')) return value.replace(/\b(\d+)\s+(min|h|d)\b/g, '$1$2');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'agora';

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays}d`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function limitWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function limitText(value: string, maxChars: number) {
  const compact = value.trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars).trimEnd()}...`;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { likedPosts, toggleLike, user, followedUsers, toggleFollowUser, deletePost } = useApp();
  const isLiked = post.likedByMe === true || likedPosts.includes(post.id);
  const isFollowingAuthor = followedUsers.includes(post.author.id);
  const isPostOwner = user?.id === post.author.id;
  const viewCount = 6 + (index % 4);
  const displayLikes = Math.max(0, post.likes);
  const [localComments, setLocalComments] = useState(post.comments);
  const [saved, setSaved] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localCommentBodies, setLocalCommentBodies] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const [remoteComments, setRemoteComments] = useState<PostCommentContract[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [goingOverlayOpen, setGoingOverlayOpen] = useState(false);
  const [goingConfirmed, setGoingConfirmed] = useState(false);
  const [localRescueOperational, setLocalRescueOperational] = useState<RescueOperationalSummary | null | undefined>();
  const [resolvedGoingCoords, setResolvedGoingCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const displayTime = formatPostTime(post.createdAt);
  const locationPreview = limitText(limitWords(post.neighborhood, 15), 38);

  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.975, { damping: 20, stiffness: 300 });
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }

  function handleLike() {
    toggleLike(post.id);
    heartScale.value = withSpring(1.4, { damping: 10, stiffness: 400 }, () => {
      heartScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleSave() {
    setSaved(!saved);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function handlePress() {
    router.push(`/post/${post.id}`);
  }

  function openAuthorProfile(author: {
    id: string;
    name: string;
    avatar: string | null;
    verified: boolean;
    type: 'person' | 'ong' | 'vet';
  }) {
    router.push({
      pathname: '/(tabs)/user/[id]',
      params: {
        id: author.id,
        profileName: author.name,
        profileAvatar: author.avatar ?? '',
        profileVerified: String(author.verified),
        profileType: author.type,
      },
    });
  }

  async function loadComments() {
    if (commentsLoading) return;

    setCommentsLoading(true);
    setCommentsError(false);
    try {
      const comments = await createZooHelpApi()?.postComments(post.id);
      setRemoteComments(comments ?? []);
      setCommentsLoaded(true);
    } catch {
      setCommentsError(true);
    } finally {
      setCommentsLoading(false);
    }
  }

  function openCommentInput() {
    const nextOpen = !commentOpen;
    setCommentOpen(nextOpen);
    if (nextOpen && !commentsLoaded) {
      void loadComments();
    }
  }

  async function submitComment() {
    const body = commentText.trim();
    if (!body || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      await createZooHelpApi()?.commentPost(post.id, body);
      setCommentText('');
      setCommentOpen(false);
      setLocalCommentBodies((prev) => [...prev, body]);
      setLocalComments((prev) => prev + 1);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Comentário', 'Não foi possível enviar agora. Tente novamente.');
    } finally {
      setCommentSubmitting(false);
    }
  }

  function removeLocalComment(index: number) {
    setLocalCommentBodies((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setLocalComments((prev) => Math.max(0, prev - 1));
  }

  function toggleCommentLike(commentId: string) {
    setLikedComments((prev) => (
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    ));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleShare() {
    shareZooHelpItem(post.name, `${post.name} no ZooHelp: ${post.description}`);
  }

  function hasPostCoords() {
    return Number.isFinite(post.latitude) && Number.isFinite(post.longitude);
  }

  function getRouteCoords() {
    if (hasPostCoords()) {
      return { latitude: post.latitude as number, longitude: post.longitude as number };
    }
    return resolvedGoingCoords;
  }

  function manualAddressText() {
    if (!post.locationAddress) return '';
    const { street, number, neighborhood, city, state } = post.locationAddress;
    return [street, number, neighborhood, city, state].filter(Boolean).join(', ');
  }

  async function resolveGoingMapCoords() {
    if (hasPostCoords() || resolvedGoingCoords) return;

    const manualAddress = post.locationAddress;
    let result: { latitude: number; longitude: number } | null = null;
    if (manualAddress?.street && manualAddress.number && manualAddress.city && manualAddress.state) {
      result = await geocodeStructuredAddress({
        street: manualAddress.street,
        number: manualAddress.number,
        neighborhood: manualAddress.neighborhood,
        city: manualAddress.city,
        state: manualAddress.state,
      });
    }

    if (!result) {
      const address = manualAddressText() || post.location || post.neighborhood;
      result = address ? await geocodeAddress(address) : null;
    }

    if (result) {
      setResolvedGoingCoords({ latitude: result.latitude, longitude: result.longitude });
    }
  }

  function openGoingOverlay() {
    setGoingOverlayOpen(true);
    resolveGoingMapCoords().catch(() => {});
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openRoute() {
    const label = encodeURIComponent(post.name || 'Caso ZooHelp');
    const coords = getRouteCoords();
    const destination = coords
      ? `${coords.latitude},${coords.longitude}`
      : encodeURIComponent(post.location || post.neighborhood || post.name);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&q=${label}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Rota indisponivel', 'Nao foi possivel abrir o mapa agora.');
    });
  }

  async function confirmGoing() {
    const api = createZooHelpApi();
    if (!api) {
      Alert.alert('Confirmacao indisponivel', 'Conecte ao backend para registrar sua ida.');
      return;
    }
    try {
      await api.confirmRescueResponse(post.id);
      setGoingConfirmed(true);
      setGoingOverlayOpen(false);
      void api.post(post.id)
        .then((updatedPost) => setLocalRescueOperational(updatedPost.rescueOperational))
        .catch(() => {});
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      openRoute();
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 404) {
        Alert.alert(
          'Confirmacao ainda indisponivel',
          'A API publicada ainda nao suporta esta confirmacao. Atualize o backend e tente novamente.',
        );
        return;
      }
      Alert.alert('Confirmacao indisponivel', 'Nao foi possivel registrar sua ida agora. Tente novamente.');
    }
  }

  function runDeletePost() {
    deletePost(post.id).catch(() => {
      Alert.alert('Excluir post', 'Nao foi possivel excluir agora. Tente novamente.');
    });
  }

  function handleDeletePost() {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window === 'undefined' ||
        window.confirm('Deseja excluir este post? Esta acao nao pode ser desfeita.');
      if (confirmed) runDeletePost();
      return;
    }

    Alert.alert(
      'Excluir post',
      'Deseja excluir este post? Esta acao nao pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: runDeletePost,
        },
      ],
    );
  }

  function renderCommentArea() {
    const visibleComments = [
      ...remoteComments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        authorId: comment.author.id,
        authorName: comment.author.name,
        authorAvatar: comment.author.avatar ?? null,
        authorVerified: comment.author.verified,
        authorType: comment.author.type,
        canDelete: false,
        localIndex: null as number | null,
      })),
      ...localCommentBodies.map((body, localIndex) => ({
        id: `local-${localIndex}-${body}`,
        body,
        authorId: user?.id ?? null,
        authorName: user?.name?.split(' ')[0] ?? 'Você',
        authorAvatar: user?.avatar ?? null,
        authorVerified: user?.verified ?? false,
        authorType: user?.type ?? 'person',
        canDelete: true,
        localIndex,
      })),
    ].slice(-3);

    return (
      <>
        {(commentOpen || localCommentBodies.length > 0) && (
          <View style={styles.commentList}>
            {commentsLoading && (
              <Text style={[styles.commentHint, { color: colors.mutedForeground }]}>Carregando comentários...</Text>
            )}
            {!commentsLoading && commentsError && (
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  void loadComments();
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.commentHint, { color: colors.primary }]}>Tentar carregar comentários novamente</Text>
              </TouchableOpacity>
            )}
            {!commentsLoading && !commentsError && visibleComments.length === 0 && (
              <Text style={[styles.commentHint, { color: colors.mutedForeground }]}>Nenhum comentário ainda.</Text>
            )}
            {!commentsLoading && !commentsError && visibleComments.map((comment) => {
              const isCommentLiked = likedComments.includes(comment.id);
              return (
                <View key={comment.id} style={styles.commentItem}>
                  <TouchableOpacity
                    style={styles.commentAuthorLink}
                    disabled={!comment.authorId}
                    onPress={(event) => {
                      event.stopPropagation();
                      if (comment.authorId) {
                        openAuthorProfile({
                          id: comment.authorId,
                          name: comment.authorName,
                          avatar: comment.authorAvatar,
                          verified: comment.authorVerified,
                          type: comment.authorType,
                        });
                      }
                    }}
                    activeOpacity={0.74}
                    accessibilityRole={comment.authorId ? 'button' : undefined}
                    accessibilityLabel={comment.authorId ? `Abrir perfil de ${comment.authorName}` : undefined}
                  >
                    <Avatar
                      name={comment.authorName}
                      size={18}
                      imageUrl={comment.authorAvatar}
                    />
                    <Text style={[styles.commentAuthor, { color: colors.foreground }]} numberOfLines={1}>
                      {comment.authorName}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.commentBody, { color: colors.mutedForeground }]}>{comment.body}</Text>
                  <TouchableOpacity
                    style={styles.commentLike}
                    onPress={(event) => {
                      event.stopPropagation();
                      toggleCommentLike(comment.id);
                    }}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={isCommentLiked ? 'Remover curtida do comentário' : 'Curtir comentário'}
                  >
                    <MaterialCommunityIcons
                      name={isCommentLiked ? 'heart' : 'heart-outline'}
                      size={14}
                      color={isCommentLiked ? '#C95A5A' : colors.mutedForeground}
                    />
                  </TouchableOpacity>
                  {comment.canDelete && comment.localIndex != null && (
                    <TouchableOpacity
                      style={styles.commentDelete}
                      onPress={(event) => {
                        event.stopPropagation();
                        removeLocalComment(comment.localIndex as number);
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel="Excluir comentário"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={13} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
        {commentOpen && (
          <View style={[styles.commentBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.foreground }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Escreva um comentário..."
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <TouchableOpacity
              style={[styles.commentSend, { backgroundColor: colors.primary, opacity: commentText.trim() ? 1 : 0.45 }]}
              onPress={submitComment}
              disabled={!commentText.trim() || commentSubmitting}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons name="send" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }

  const imageUris =
    post.images && post.images.length > 0
      ? post.images
      : post.image
      ? [post.image]
      : [ANIMAL_PLACEHOLDERS[post.animalType]];
  const imageUri = imageUris[0];
  const hasPhotoGrid = imageUris.length > 1;
  const distance = formatDistanceKm(post.distanceKm);
  const isResolved = post.rescueStatus === 'resolved';
  const displayUrgent = post.urgent || post.tags.includes('urgente');
  const canJoinRescue = !isResolved;
  const helpGoingCount = (localRescueOperational ?? post.rescueOperational)?.helpGoingCount ?? 0;
  const helpGoingLabel = helpGoingCount === 1 ? '1 pessoa a caminho' : `${helpGoingCount} pessoas a caminho`;
  const ctaLabel = isResolved ? 'Ver resolução' : CTA_LABELS[post.type] ?? 'Ver mais';
  const accentColor = CTA_COLORS[post.type] ?? colors.primary;
  const ctaColor = colors.primary;
  const imageOverlay = (
    <>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={styles.imageGradient}
      />

      <View style={styles.imageTopRow}>
        <StatusBadge type={post.type} urgent={displayUrgent && !isResolved} resolved={isResolved} size="sm" hideType />
      </View>

      <View style={styles.imageBottomRow}>
        {distance && (
          <View style={styles.distanceBadge}>
            <MaterialCommunityIcons name="navigation-variant" size={11} color="#FFFFFF" />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
        {post.author.type === 'ong' && (
          <View style={styles.ongBadge}>
            <MaterialCommunityIcons name="check-decagram" size={11} color="#FFFFFF" />
            <Text style={styles.ongBadgeText}>ONG Verificada</Text>
          </View>
        )}
      </View>
    </>
  );

  function renderGoingOverlay() {
    const coords = getRouteCoords() ?? DEFAULT_MAP_COORDS;
    const mapLat = coords.latitude;
    const mapLng = coords.longitude;
    const locationLabel = post.location || post.neighborhood || 'Localizacao do caso';

    return (
      <Modal
        transparent
        animationType="fade"
        visible={goingOverlayOpen}
        onRequestClose={() => setGoingOverlayOpen(false)}
      >
        <View style={styles.goingOverlayRoot}>
          <TouchableOpacity
            style={styles.goingBackdrop}
            activeOpacity={1}
            onPress={() => setGoingOverlayOpen(false)}
          />
          <View style={styles.goingSheet}>
            <View style={styles.goingHandle} />
            <View style={styles.goingHeader}>
              <View style={styles.goingHeaderIcon}>
                <MaterialCommunityIcons name="run-fast" size={18} color="#2D6A4F" />
              </View>
              <View style={styles.goingHeaderText}>
                <Text style={styles.goingTitle}>Confirmar ajuda</Text>
                <Text style={styles.goingSubtitle} numberOfLines={2}>
                  Confirme apenas se voce realmente consegue ir ate o local agora.
                </Text>
              </View>
              <TouchableOpacity style={styles.goingClose} onPress={() => setGoingOverlayOpen(false)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={17} color="#5F6861" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.overlayMapCard} onPress={openRoute} activeOpacity={0.86}>
              <View style={styles.overlayMapInfo}>
                <Text style={styles.overlayMapTitle}>Area de resgate</Text>
                <Text style={styles.overlayMapSubtitle} numberOfLines={2}>Baseado na localizacao do caso</Text>
                <Text style={styles.overlayMapLink}>{'Abrir rota ->'}</Text>
              </View>
              <View style={styles.overlayMapPreview}>
                <StaticMapTiles latitude={mapLat} longitude={mapLng} zoom={13} opacity={0.92} />
                <View style={styles.overlayMapPulseOuter}>
                  <View style={styles.overlayMapPulseInner} />
                </View>
                <View style={styles.overlayMapSmallPin} />
              </View>
            </TouchableOpacity>

            <View style={styles.goingNotice}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color="#7C867C" />
              <Text style={styles.goingNoticeText} numberOfLines={2}>{locationLabel}</Text>
            </View>

            <TouchableOpacity style={styles.confirmGoingBtn} onPress={confirmGoing} activeOpacity={0.9}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.confirmGoingText}>Confirmar que estou indo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelGoingBtn} onPress={() => setGoingOverlayOpen(false)} activeOpacity={0.8}>
              <Text style={styles.cancelGoingText}>Ainda nao consigo confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  const postImageMedia = hasPhotoGrid ? (
    <View style={[styles.imageContainer, styles.inlineImageContainer, styles.imageGrid]}>
      {imageUris.slice(0, 2).map((uri, photoIndex) => (
        <View key={`${uri}-${photoIndex}`} style={styles.imageGridItem}>
          <Image
            source={{ uri }}
            style={styles.imageGridPhoto}
            contentFit="cover"
            transition={400}
          />
          {photoIndex === 1 && imageUris.length > 2 && (
            <View style={styles.photoMoreOverlay}>
              <Text style={styles.photoMoreText}>+{imageUris.length - 2}</Text>
            </View>
          )}
        </View>
      ))}
      {imageOverlay}
    </View>
  ) : (
    <View style={[styles.imageContainer, styles.inlineImageContainer]}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        contentFit="cover"
        transition={400}
      />
      {imageOverlay}
    </View>
  );

  /* â”€â”€ TEXT-ONLY CARD (premium) â”€â”€ */
  if (post.textOnly) {
    return (
      <Animated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={[styles.card, styles.textCard, { backgroundColor: colors.card }]}
          onPress={handlePress}
          onPressIn={commentOpen ? undefined : handlePressIn}
          onPressOut={commentOpen ? undefined : handlePressOut}
          activeOpacity={1}
          disabled={commentOpen}
        >
          <View style={styles.textCardBody}>
            {/* Header row: badge left, save+share right */}
            <View style={styles.textHeaderRow}>
              <StatusBadge type={post.type} urgent={displayUrgent && !isResolved} resolved={isResolved} size="sm" />
              <View style={styles.textHeaderRight}>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={15}
                    color={saved ? accentColor : colors.mutedForeground}
                  />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.iconCircle} onPress={handleShare}>
                  <MaterialCommunityIcons name="share-variant-outline" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Author */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => router.push({ pathname: '/(tabs)/user/[id]', params: { id: post.author.id } })}
              activeOpacity={0.75}
            >
              <Avatar
                name={post.author.name}
                size={36}
                verified={post.author.verified}
                type={post.author.type}
                imageUrl={post.author.avatar}
              />
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
                    {post.author.name}
                  </Text>
                  {post.author.type === 'ong' && (
                    <MaterialCommunityIcons name="check-decagram" size={13} color="#2F80ED" />
                  )}
                </View>
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {post.neighborhood} · {displayTime}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Body text */}
            <Text style={[styles.textContent, { color: colors.foreground }]} numberOfLines={4}>
              {post.description}
            </Text>

            <OperationalStatus post={post} variant="compact" />
            {helpGoingCount > 0 && (
              <View style={styles.rescueMomentum}>
                <View style={styles.rescueMomentumDot} />
                <Text style={styles.rescueMomentumText}>{helpGoingLabel}</Text>
              </View>
            )}

            {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={[styles.tag, styles.infoChipTag, { backgroundColor: accentColor + '12', borderColor: accentColor + '28' }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={11} color={accentColor} />
                    <Text style={[styles.tagText, { color: accentColor }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={[styles.textActionsRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
                <Animated.View style={animatedHeartStyle}>
                  <MaterialCommunityIcons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={17}
                    color={isLiked ? '#FF3B30' : colors.mutedForeground}
                  />
                </Animated.View>
                <Text style={[styles.actionCount, { color: isLiked ? '#FF3B30' : colors.mutedForeground }]}>
                  {displayLikes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={(event) => {
                  event.stopPropagation();
                  openCommentInput();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="comment-outline" size={17} color={colors.mutedForeground} />
                <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{localComments}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              {canJoinRescue ? (
                <TouchableOpacity
                  style={[styles.goingBtn, goingConfirmed && styles.goingBtnConfirmed]}
                  onPress={openGoingOverlay}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={goingConfirmed ? 'check' : 'run-fast'}
                    size={13}
                    color={goingConfirmed ? '#FFFFFF' : colors.primary}
                  />
                  <Text style={[styles.goingText, { color: goingConfirmed ? '#FFFFFF' : colors.primary }]}>
                    {goingConfirmed ? 'Indo' : 'Estou indo'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.ctaSmall, { backgroundColor: ctaColor, shadowColor: ctaColor }]}
                  onPress={handlePress}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.ctaSmallText, { color: '#fff' }]}>{ctaLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
            {renderCommentArea()}
          </View>
        </TouchableOpacity>
        {renderGoingOverlay()}
      </Animated.View>
    );
  }

  /* â”€â”€ IMAGE CARD â”€â”€ */
  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        onPress={handlePress}
        onPressIn={commentOpen ? undefined : handlePressIn}
        onPressOut={commentOpen ? undefined : handlePressOut}
        activeOpacity={1}
        disabled={commentOpen}
      >
        {/* Card body */}
        <View style={styles.cardBody}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => router.push({ pathname: '/(tabs)/user/[id]', params: { id: post.author.id } })}
            activeOpacity={0.75}
          >
            <Avatar
              name={post.author.name}
              size={30}
              verified={post.author.verified}
              type={post.author.type}
              imageUrl={post.author.avatar}
            />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
                  {post.author.name}
                </Text>
                {post.author.type === 'ong' && (
                  <MaterialCommunityIcons name="check-decagram" size={13} color="#2F80ED" />
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={[
                    styles.feedFollowBtn,
                    {
                      backgroundColor: isFollowingAuthor ? colors.muted : colors.primary,
                      borderColor: isFollowingAuthor ? colors.border : colors.primary,
                    },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleFollowUser(post.author.id);
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.feedFollowText, { color: isFollowingAuthor ? colors.mutedForeground : '#FFFFFF' }]}>
                    {isFollowingAuthor ? 'Seguindo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.feedTimeRow}>
                  <Image source={{ uri: FEED_TIME_ICON }} style={styles.feedTimeIcon} contentFit="contain" />
                  <Text style={[styles.feedTimeText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {displayTime}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {locationPreview}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.animalSection}>
            <Text style={[styles.description, styles.descriptionPrimary, { color: colors.foreground }]} numberOfLines={2}>
              {post.description}
            </Text>
          </View>

          <OperationalStatus post={post} />
          {helpGoingCount > 0 && (
            <View style={styles.rescueMomentum}>
              <View style={styles.rescueMomentumDot} />
              <Text style={styles.rescueMomentumText}>{helpGoingLabel}</Text>
            </View>
          )}

          {postImageMedia}

          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={[styles.tag, styles.infoChipTag, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '22' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={10} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
              <Animated.View style={animatedHeartStyle}>
                <MaterialCommunityIcons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? '#FF3B30' : colors.mutedForeground}
                />
              </Animated.View>
              <Text style={[styles.actionCount, { color: isLiked ? '#FF3B30' : colors.mutedForeground }]}>
                {displayLikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(event) => {
                event.stopPropagation();
                openCommentInput();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="comment-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{localComments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            {canJoinRescue && (
              <TouchableOpacity
                style={[styles.goingBtn, goingConfirmed && styles.goingBtnConfirmed]}
                onPress={openGoingOverlay}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={goingConfirmed ? 'check' : 'run-fast'}
                  size={13}
                  color={goingConfirmed ? '#FFFFFF' : colors.primary}
                />
                <Text style={[styles.goingText, { color: goingConfirmed ? '#FFFFFF' : colors.primary }]}>
                  {goingConfirmed ? 'Indo' : 'Estou indo'}
                </Text>
              </TouchableOpacity>
            )}
            {isPostOwner ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleDeletePost();
                  }}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir post"
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
            ) : (
              <View style={styles.actionBtn}>
                <MaterialCommunityIcons name="eye-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{viewCount}</Text>
              </View>
            )}
          </View>
          {renderCommentArea()}
        </View>
      </TouchableOpacity>
      {renderGoingOverlay()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
    ...PREMIUM_SHADOW,
  },
  textCard: { flexDirection: 'column' },
  textTopBar: { height: 3, width: '100%' },
  textCardBody: { flex: 1, padding: 13, gap: 9 },
  textHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textHeaderRight: { flexDirection: 'row', gap: 4 },
  iconCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  textActionsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, marginTop: 1,
  },
  imageContainer: {
    height: CARD_IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#F4F6F3',
  },
  inlineImageContainer: {
    marginTop: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: { width: '100%', height: CARD_IMAGE_HEIGHT },
  imageGrid: {
    flexDirection: 'row',
    gap: 2,
  },
  imageGridItem: {
    flex: 1,
    height: CARD_IMAGE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E8ECF0',
  },
  imageGridPhoto: {
    width: '100%',
    height: '100%',
  },
  photoThumbStrip: {
    position: 'absolute',
    right: 10,
    bottom: 46,
    flexDirection: 'row',
    gap: 5,
  },
  photoThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  photoMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
  },
  imageTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageTopRight: { flexDirection: 'row', gap: 5 },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 0 },
    }),
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 9,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceText: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#FFFFFF' },
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  photoCountText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF' },
  ongBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(47, 128, 237, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ongBadgeText: { fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF' },
  cardBody: { padding: 12, gap: 7 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  authorName: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  metaText: { flex: 1, fontSize: 9, fontFamily: 'Montserrat_400Regular' },
  feedFollowBtn: {
    minHeight: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  feedFollowText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
  },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeIcon: { width: 13, height: 13, opacity: 0.72 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  animalSection: { gap: 2 },
  animalTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  animalName: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.13)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  animalBreed: { flex: 1, fontSize: 10, fontFamily: 'Montserrat_400Regular' },
  description: { fontSize: 11, fontFamily: 'Montserrat_400Regular', lineHeight: 15, marginTop: 1 },
  descriptionPrimary: { fontSize: 12, fontFamily: 'Montserrat_500Medium', lineHeight: 17, marginTop: 0, marginLeft: 7 },
  textContent: { fontSize: 13, fontFamily: 'Montserrat_400Regular', lineHeight: 19 },
  rescueMomentum: {
    alignSelf: 'flex-start',
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 11,
    backgroundColor: '#EFF7F1',
    borderWidth: 1,
    borderColor: '#D7E7DA',
  },
  rescueMomentumDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32A05B',
  },
  rescueMomentumText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#326044',
  },
  tagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  infoChipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontFamily: 'Montserrat_400Regular' },
  divider: { height: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  commentBox: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 21,
    paddingLeft: 13,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 0,
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  commentSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 40,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  deletePostBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,86,69,0.10)',
  },
  actionCount: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
  commentList: {
    gap: 5,
  },
  commentHint: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    paddingHorizontal: 2,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  commentAuthorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commentAuthor: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  commentBody: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    lineHeight: 15,
  },
  commentLike: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -3,
  },
  commentDelete: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -3,
  },
  ctaBtn: {
  minHeight: 40,
  justifyContent: 'center',
  paddingHorizontal: 15,
  borderRadius: 20,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,        // mais suave
  shadowRadius: 8,
  elevation: 2,
  // glow sutil (opcional)
  ...Platform.select({
    ios: {
      shadowColor: '#2D6A4F',
    },
    android: {},
  }),
},
  ctaBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  ctaSmall: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 18 },
  ctaSmallText: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
  goingBtn: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#EAF3EC',
    borderWidth: 1,
    borderColor: '#CFE0D4',
  },
  goingBtnConfirmed: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  goingText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
  },
  goingOverlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  goingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,28,22,0.34)',
  },
  goingSheet: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EDE8',
    shadowColor: '#172018',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  goingHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDE5DF',
    marginBottom: 13,
  },
  goingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  goingHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EC',
  },
  goingHeaderText: { flex: 1, gap: 2 },
  goingTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#172018',
  },
  goingSubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    lineHeight: 16,
    color: '#667168',
  },
  goingClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F3',
  },
  overlayMapCard: {
    height: 102,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2EE',
    marginBottom: 10,
  },
  overlayMapInfo: {
    width: 138,
    padding: 15,
    gap: 3,
    zIndex: 2,
    backgroundColor: '#FFFFFF',
  },
  overlayMapTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  overlayMapSubtitle: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: '#9AA19A', lineHeight: 13 },
  overlayMapLink: { marginTop: 7, fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  overlayMapPreview: { flex: 1, backgroundColor: '#F2F3F0', position: 'relative' },
  overlayMapPulseOuter: {
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
  overlayMapPulseInner: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FF5A8C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  overlayMapSmallPin: {
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
  goingNotice: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#F7F9F6',
    marginBottom: 10,
  },
  goingNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#5F6861',
  },
  confirmGoingBtn: {
    minHeight: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2D6A4F',
    shadowColor: '#2D6A4F',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  confirmGoingText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
  cancelGoingBtn: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  cancelGoingText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#7C867C',
  },
});
