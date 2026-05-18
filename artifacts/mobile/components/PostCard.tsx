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

const CARD_IMAGE_HEIGHT = 180;

const ANIMAL_PLACEHOLDERS: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=700&q=85',
  cat: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=700&q=85',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=700&q=85',
};

const DISTANCES = ['0.3 km', '0.8 km', '1.2 km', '1.5 km', '2.1 km', '3.4 km'];

const CTA_LABELS: Record<string, string> = {
  adoption:  'Quero adotar ❤️',
  emergency: 'Ajudar agora 🚨',
  campaign:  'Fazer doação 💚',
  lost:      'Vi esse pet 🔍',
  found:     'Entrar em contato',
};

const CTA_COLORS: Record<string, string> = {
  adoption:  '#4CAF50',
  emergency: '#FF3B30',
  campaign:  '#9B59B6',
  lost:      '#FF9800',
  found:     '#2F80ED',
};

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

  const imageUri = ANIMAL_PLACEHOLDERS[post.animalType];
  const distance = DISTANCES[index % DISTANCES.length];
  const ctaLabel = CTA_LABELS[post.type] ?? 'Ver mais';
  const ctaColor = CTA_COLORS[post.type] ?? '#4CAF50';

  /* ── TEXT-ONLY CARD (premium) ── */
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
                <TouchableOpacity activeOpacity={0.7} style={styles.iconCircle}>
                  <MaterialCommunityIcons name="share-variant-outline" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Author */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => {
                const ongId = AUTHOR_TO_ONG[post.author.id];
                if (ongId) router.push(`/ong/${post.author.id}`);
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
                  {post.neighborhood} · {post.createdAt}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Body text */}
            <Text style={[styles.textContent, { color: colors.foreground }]} numberOfLines={5}>
              {post.description}
            </Text>

            {/* Tags */}
            {post.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {post.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: ctaColor + '14', borderColor: ctaColor + '30', borderWidth: 1 }]}>
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

  /* ── IMAGE CARD ── */
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
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.imageGradient}
          />

          {/* Top overlays */}
          <View style={styles.imageTopRow}>
            <StatusBadge type={post.type} urgent={post.urgent} />
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
              if (ongId) router.push(`/ong/${post.author.id}`);
            }}
            activeOpacity={AUTHOR_TO_ONG[post.author.id] ? 0.75 : 1}
          >
            <Avatar name={post.author.name} size={34} verified={post.author.verified} type={post.author.type} />
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
                  {post.neighborhood} · {post.createdAt}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.animalSection}>
            <Text style={[styles.animalName, { color: colors.foreground }]}>{post.name}</Text>
            <Text style={[styles.animalBreed, { color: colors.mutedForeground }]}>
              {post.breed} · {post.age}
            </Text>
            <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={2}>
              {post.description}
            </Text>
          </View>

          {post.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {post.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
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
                  size={19}
                  color={isLiked ? '#FF3B30' : colors.mutedForeground}
                />
              </Animated.View>
              <Text style={[styles.actionCount, { color: isLiked ? '#FF3B30' : colors.mutedForeground }]}>
                {localLikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handlePress} activeOpacity={0.7}>
              <MaterialCommunityIcons name="comment-outline" size={19} color={colors.mutedForeground} />
              <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="share-variant-outline" size={19} color={colors.mutedForeground} />
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  textCard: { flexDirection: 'column' },
  textTopBar: { height: 3, width: '100%' },
  textCardBody: { flex: 1, padding: 16, gap: 12 },
  textHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textHeaderRight: { flexDirection: 'row', gap: 4 },
  iconCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  textActionsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, marginTop: 2,
  },
  imageContainer: {
    height: CARD_IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: '#E8ECF0',
  },
  image: { width: '100%', height: CARD_IMAGE_HEIGHT },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  imageTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageTopRight: { flexDirection: 'row', gap: 6 },
  floatingBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#FFFFFF' },
  ongBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(47, 128, 237, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ongBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  cardBody: { padding: 14, gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  authorName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  metaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  animalSection: { gap: 3 },
  animalName: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  animalBreed: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  description: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: 2 },
  textContent: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 23 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  tagText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  divider: { height: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionCount: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  ctaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.1 },
  ctaSmall: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18 },
  ctaSmallText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
