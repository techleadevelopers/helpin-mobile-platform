import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { AUTHOR_TO_ONG, Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { shareZooHelpItem } from '@/services/share';

const CARD_IMAGE_HEIGHT = 148;

const ANIMAL_PLACEHOLDERS: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=700&q=85',
  cat: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=700&q=85',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=700&q=85',
};

const DISTANCES = ['0.3 km', '0.8 km', '1.2 km', '1.5 km', '2.1 km', '3.4 km'];

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

export function PostCard({ post, index = 0 }: PostCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { likedPosts, toggleLike } = useApp();
  const isLiked = likedPosts.includes(post.id);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [saved, setSaved] = useState(false);

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
    const wasLiked = isLiked;
    toggleLike(post.id);
    setLocalLikes((prev) => (wasLiked ? prev - 1 : prev + 1));
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

  function handleShare() {
    shareZooHelpItem(post.name, `${post.name} no ZooHelp: ${post.description}`);
  }

  const imageUris =
    post.images && post.images.length > 0
      ? post.images
      : post.image
      ? [post.image]
      : [ANIMAL_PLACEHOLDERS[post.animalType]];
  const imageUri = imageUris[0];
  const hasPhotoGrid = imageUris.length > 1;
  const distance = DISTANCES[index % DISTANCES.length];
  const ctaLabel = CTA_LABELS[post.type] ?? 'Ver mais';
  const ctaColor = CTA_COLORS[post.type] ?? '#4CAF50';

  /* â”€â”€ TEXT-ONLY CARD (premium) â”€â”€ */
  if (post.textOnly) {
    return (
      <Animated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={[styles.card, styles.textCard, { backgroundColor: colors.card }]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.textCardBody}>
            {/* Header row: badge left, save+share right */}
            <View style={styles.textHeaderRow}>
              <StatusBadge type={post.type} size="sm" />
              <View style={styles.textHeaderRight}>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={15}
                    color={saved ? ctaColor : colors.mutedForeground}
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
              onPress={() => {
                const ongId = AUTHOR_TO_ONG[post.author.id];
                if (ongId) router.push(`/ong/${ongId}`);
              }}
              activeOpacity={AUTHOR_TO_ONG[post.author.id] ? 0.75 : 1}
            >
              <Avatar name={post.author.name} size={36} verified={post.author.verified} type={post.author.type} />
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
                  {post.neighborhood} Â· {post.createdAt}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Body text */}
            <Text style={[styles.textContent, { color: colors.foreground }]} numberOfLines={4}>
              {post.description}
            </Text>

            {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={[styles.tag, styles.infoChipTag, { backgroundColor: ctaColor + '12', borderColor: ctaColor + '28' }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={11} color={ctaColor} />
                    <Text style={[styles.tagText, { color: ctaColor }]}>#{tag}</Text>
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
                  {localLikes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
                <MaterialCommunityIcons name="comment-outline" size={17} color={colors.mutedForeground} />
                <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.comments}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }} />

              <TouchableOpacity
                style={[styles.ctaSmall, { backgroundColor: ctaColor, shadowColor: ctaColor }]}
                onPress={handlePress}
                activeOpacity={0.85}
              >
                <Text style={[styles.ctaSmallText, { color: '#fff' }]}>{ctaLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  /* â”€â”€ IMAGE CARD â”€â”€ */
  return (
    <Animated.View style={animatedCardStyle}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Hero image */}
        <View style={styles.imageContainer}>
          {hasPhotoGrid ? (
            <View style={styles.photoGrid}>
              <Image
                source={{ uri: imageUri }}
                style={styles.photoGridMain}
                contentFit="cover"
                transition={400}
              />
              <View style={styles.photoGridSide}>
                {imageUris.slice(1, 3).map((uri, photoIndex) => (
                  <View key={`${uri}-${photoIndex}`} style={styles.photoGridThumbWrap}>
                    <Image
                      source={{ uri }}
                      style={styles.photoGridThumb}
                      contentFit="cover"
                      transition={400}
                    />
                    {photoIndex === 1 && imageUris.length > 3 && (
                      <View style={styles.photoMoreOverlay}>
                        <Text style={styles.photoMoreText}>+{imageUris.length - 3}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={400}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageGradient}
          />

          {/* Top overlays */}
          <View style={styles.imageTopRow}>
            <StatusBadge type={post.type} urgent={post.urgent} size="sm" />
            <View style={styles.imageTopRight}>
              <TouchableOpacity
                style={[styles.floatingBtn, { backgroundColor: 'rgba(0,0,0,0.38)' }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={saved ? '#FFD700' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.floatingBtn, { backgroundColor: 'rgba(0,0,0,0.38)' }]}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom overlays */}
          <View style={styles.imageBottomRow}>
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons name="navigation-variant" size={11} color="#FFFFFF" />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
            {hasPhotoGrid && (
              <View style={styles.photoCountBadge}>
                <MaterialCommunityIcons name="image-multiple-outline" size={11} color="#FFFFFF" />
                <Text style={styles.photoCountText}>{imageUris.length}</Text>
              </View>
            )}
            {post.author.type === 'ong' && (
              <View style={styles.ongBadge}>
                <MaterialCommunityIcons name="check-decagram" size={11} color="#FFFFFF" />
                <Text style={styles.ongBadgeText}>ONG Verificada</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => {
              const ongId = AUTHOR_TO_ONG[post.author.id];
              if (ongId) router.push(`/ong/${ongId}`);
            }}
            activeOpacity={AUTHOR_TO_ONG[post.author.id] ? 0.75 : 1}
          >
            <Avatar name={post.author.name} size={30} verified={post.author.verified} type={post.author.type} />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
                  {post.author.name}
                </Text>
                {post.author.type === 'ong' && (
                  <MaterialCommunityIcons name="check-decagram" size={13} color="#2F80ED" />
                )}
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {post.neighborhood} Â· {post.createdAt}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.animalSection}>
            <View style={styles.animalTitleRow}>
              <Text style={[styles.animalName, { color: colors.foreground }]} numberOfLines={1}>
                {post.name}
              </Text>
              <Text style={[styles.animalBreed, { color: colors.mutedForeground }]} numberOfLines={1}>
                {post.breed} Â· {post.age}
              </Text>
            </View>
            <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
              {post.description}
            </Text>
          </View>

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
                {localLikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
              <MaterialCommunityIcons name="comment-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: ctaColor, shadowColor: ctaColor }]}
              onPress={handlePress}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
    backgroundColor: '#E8ECF0',
  },
  image: { width: '100%', height: CARD_IMAGE_HEIGHT },
  photoGrid: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    flexDirection: 'row',
    gap: 2,
  },
  photoGridMain: {
    flex: 1,
    height: CARD_IMAGE_HEIGHT,
  },
  photoGridSide: {
    width: 96,
    height: CARD_IMAGE_HEIGHT,
    gap: 2,
  },
  photoGridThumbWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  photoGridThumb: {
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
    fontSize: 16,
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
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  metaText: { fontSize: 9, fontFamily: 'Montserrat_400Regular' },
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
  textContent: { fontSize: 13, fontFamily: 'Montserrat_400Regular', lineHeight: 19 },
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 40,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  actionCount: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
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
});

