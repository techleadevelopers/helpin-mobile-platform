import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { AUTHOR_TO_ONG, MOCK_POSTS, POST_TYPE_CONFIG } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { shareZooHelpItem } from '@/services/share';
import { createZooHelpApi } from '@/services/zoohelpApi';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIMAL_PLACEHOLDERS: Record<string, string> = {
  dog:   'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80',
  cat:   'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=800&q=80',
};

const STATS: Array<{ icon: MCIcon; key: 'likes' | 'comments' | 'shares'; label: string }> = [
  { icon: 'heart-outline',          key: 'likes',    label: 'Curtidas' },
  { icon: 'comment-outline',        key: 'comments', label: 'Comentários' },
  { icon: 'share-variant-outline',  key: 'shares',   label: 'Compartilhar' },
];

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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { likedPosts, toggleLike, posts } = useApp();
  const [liked, setLiked] = useState(false);

  const post = posts.find((p) => p.id === id) ?? MOCK_POSTS.find((p) => p.id === id);
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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
  const imageUri = ANIMAL_PLACEHOLDERS[post.animalType];
  const isLiked = likedPosts.includes(post.id) || liked;

  function handleLike() {
    setLiked(!isLiked);
    toggleLike(activePost.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleContact() {
    if (!activePost.contact) {
      Alert.alert('Contato', 'Entre em contato pelo chat do aplicativo.');
      return;
    }
    const phone = activePost.contact.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`).catch(() => {
      Linking.openURL(`tel:${activePost.contact}`);
    });
  }

  async function handleOpenChat() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rooms = await createZooHelpApi()?.chatRooms().catch(() => []);
    const room = rooms?.find((item) => item.postId === activePost.id);
    if (!room) {
      Alert.alert('Chat indisponivel', 'O chat deste caso ainda nao foi confirmado no servidor.');
      return;
    }
    router.push(
      `/chat/${room.id}?postName=${encodeURIComponent(activePost.name)}&authorName=${encodeURIComponent(activePost.author.name)}&chatType=adoption`
    );
  }

  function handleShare() {
    shareZooHelpItem(activePost.name, `${activePost.name} no ZooHelp: ${activePost.description}`);
  }

  const actionLabel =
    activePost.type === 'adoption' ? 'Quero adotar' :
    activePost.type === 'emergency' ? 'Ajudar' :
    activePost.type === 'campaign' ? 'Apoiar' :
    activePost.type === 'lost' ? 'Encontrei' : 'Contato';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: 'rgba(0,0,0,0.45)',
                top: (Platform.OS === 'web' ? 67 : insets.top) + 12,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareFloatBtn, { backgroundColor: 'rgba(0,0,0,0.45)', top: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.imageBadge}>
            <StatusBadge type={post.type} urgent={post.urgent} />
          </View>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Text style={[styles.animalName, { color: colors.foreground }]}>{post.name}</Text>
              <View style={styles.breedAgeRow}>
                <Text style={[styles.breedAge, { color: colors.mutedForeground }]}>
                  {post.breed}
                </Text>
                <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
                <Text style={[styles.breedAge, { color: colors.mutedForeground }]}>
                  {post.age}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.likeBtn,
                {
                  backgroundColor: isLiked ? '#C95A5A10' : 'transparent',
                  borderColor: isLiked ? '#C95A5A30' : colors.border,
                },
              ]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#C95A5A' : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
              {post.neighborhood}, {post.location}
            </Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>· {post.createdAt}</Text>
          </View>

          {/* Info chips */}
          <View style={styles.infoChipsRow}>
            <DetailInfoChip icon="shield-check" text="Verificado" color="#7B8B8B" />
            <DetailInfoChip icon="clock-fast" text="Resposta rápida" color="#A8886B" />
          </View>

          {/* Author card */}
          {(() => {
            const ongId = AUTHOR_TO_ONG[post.author.id];
            const isOrg = post.author.type === 'ong' || post.author.type === 'vet';
            const authorLabel =
              post.author.type === 'ong' ? 'ONG' :
              post.author.type === 'vet' ? 'Veterinário' : 'Protetor';
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
                onPress={() => ongId && router.push(`/ong/${ongId}`)}
                activeOpacity={ongId ? 0.85 : 1}
              >
                <Avatar name={post.author.name} size={40} verified={false} type={post.author.type} />
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
                    {post.author.verified && (
                      <MaterialCommunityIcons name="check-decagram" size={12} color="#7B8B8B" />
                    )}
                  </View>
                  <Text style={[styles.authorType, { color: colors.mutedForeground }]}>
                    {authorLabel}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.chatBtn,
                    {
                      backgroundColor: colors.primary + '08',
                      borderColor: colors.primary + '20',
                    },
                  ]}
                  onPress={handleOpenChat}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="message-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })()}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre</Text>
            <Text style={[styles.description, { color: colors.foreground }]}>{post.description}</Text>
          </View>

          {/* Tags */}
          {post.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Características</Text>
              <View style={styles.tagsRow}>
                {post.tags.map((tag) => (
                  <View
                    key={tag}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.mutedForeground }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <View
                key={stat.label}
                style={[
                  styles.statBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons name={stat.icon} size={18} color={colors.mutedForeground} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{post[stat.key]}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
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
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        {post.type === 'adoption' && (
          <TouchableOpacity
            style={[styles.bottomChatBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={handleOpenChat}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chat-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.chatBtnText, { color: colors.mutedForeground }]}>Chat</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.mainActionBtn,
            { backgroundColor: cfg.bgColor },
          ]}
          onPress={handleContact}
          activeOpacity={0.85}
        >
          <Text style={styles.mainActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageContainer: { position: 'relative', height: 280 },
  image: { width: SCREEN_WIDTH, height: 280 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareFloatBtn: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: { position: 'absolute', bottom: 14, left: 14 },
  content: { padding: 18, gap: 16 },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleInfo: { flex: 1, gap: 4 },
  animalName: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -0.4,
  },
  breedAgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breedAge: { fontSize: 12, fontFamily: 'Montserrat_400Regular', opacity: 0.7 },
  dot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.5 },
  likeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, fontFamily: 'Montserrat_400Regular', flex: 1 },
  timeText: { fontSize: 11, fontFamily: 'Montserrat_400Regular', opacity: 0.6 },

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
  },
  authorInfo: { flex: 1, gap: 2 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  authorName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  authorType: { fontSize: 11, fontFamily: 'Montserrat_400Regular', opacity: 0.6 },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },

  section: { gap: 6 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -0.3,
  },
  description: { fontSize: 14, fontFamily: 'Montserrat_400Regular', lineHeight: 21, opacity: 0.85 },

  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  tagText: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },

  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    gap: 4,
    borderWidth: 0.5,
  },
  statValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Montserrat_500Medium', textAlign: 'center' },

  errorText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', marginTop: 10 },

  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  mainActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  chatBtnText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
});
