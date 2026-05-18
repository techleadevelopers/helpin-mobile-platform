import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
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
  { icon: 'share-variant-outline',  key: 'shares',   label: 'Compartilhamentos' },
];

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
        <MaterialCommunityIcons name="paw-off" size={40} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Caso não encontrado</Text>
      </View>
    );
  }

  const cfg = POST_TYPE_CONFIG[post.type];
  const imageUri = ANIMAL_PLACEHOLDERS[post.animalType];
  const isLiked = likedPosts.includes(post.id) || liked;

  function handleLike() {
    setLiked(!isLiked);
    toggleLike(post.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleContact() {
    if (!post.contact) {
      Alert.alert('Contato', 'Entre em contato pelo chat do aplicativo.');
      return;
    }
    const phone = post.contact.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`).catch(() => {
      Linking.openURL(`tel:${post.contact}`);
    });
  }

  function handleOpenChat() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(
      `/chat/${post.author.id}?postName=${encodeURIComponent(post.name)}&authorName=${encodeURIComponent(post.author.name)}&chatType=adoption`
    );
  }

  const actionLabel =
    post.type === 'adoption' ? 'Quero adotar ❤️' :
    post.type === 'emergency' ? 'Quero ajudar 🚨' :
    post.type === 'campaign' ? 'Fazer doação 💚' :
    post.type === 'lost' ? 'Vi esse animal 🔍' : 'Entrar em contato';

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
                backgroundColor: 'rgba(0,0,0,0.42)',
                top: (Platform.OS === 'web' ? 67 : insets.top) + 12,
              },
            ]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareFloatBtn, { backgroundColor: 'rgba(0,0,0,0.42)', top: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={20} color="#FFFFFF" />
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
              <Text style={[styles.breedAge, { color: colors.mutedForeground }]}>
                {post.breed} · {post.age}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.likeBtn,
                {
                  backgroundColor: isLiked ? '#FF3B3015' : colors.muted,
                  borderColor: isLiked ? '#FF3B3045' : 'transparent',
                  shadowColor: isLiked ? '#FF3B30' : 'transparent',
                },
              ]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#FF3B30' : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={15} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
              {post.neighborhood}, {post.location}
            </Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>· {post.createdAt}</Text>
          </View>

          {/* Author */}
          {(() => {
            const ongId = AUTHOR_TO_ONG[post.author.id];
            const isOrg = post.author.type === 'ong' || post.author.type === 'vet';
            const authorLabel =
              post.author.type === 'ong' ? 'Organização' :
              post.author.type === 'vet' ? 'Veterinário' : 'Protetor(a)';
            return (
              <TouchableOpacity
                style={[
                  styles.authorCard,
                  {
                    backgroundColor: colors.muted,
                    borderColor: isOrg ? '#4CAF5028' : 'transparent',
                    borderWidth: isOrg ? 1.5 : 0,
                    shadowColor: isOrg ? '#4CAF50' : 'transparent',
                    shadowOpacity: isOrg ? 0.12 : 0,
                    shadowRadius: isOrg ? 8 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: isOrg ? 2 : 0,
                  },
                ]}
                onPress={() => ongId && router.push(`/ong/${post.author.id}`)}
                activeOpacity={ongId ? 0.85 : 1}
              >
                <Avatar name={post.author.name} size={44} verified={post.author.verified} type={post.author.type} />
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
                    {isOrg && (
                      <MaterialCommunityIcons name="check-decagram" size={15} color="#2F80ED" />
                    )}
                  </View>
                  <Text style={[styles.authorType, { color: colors.mutedForeground }]}>
                    {authorLabel}{post.author.verified ? ' · Verificado' : ''}
                    {ongId ? ' · Ver perfil →' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.chatBtn,
                    {
                      backgroundColor: '#2F80ED14',
                      borderColor: '#2F80ED40',
                      shadowColor: '#2F80ED',
                    },
                  ]}
                  onPress={() => router.push('/chat/c1')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="message-outline" size={17} color="#2F80ED" />
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
                        backgroundColor: colors.primary + '12',
                        borderColor: colors.primary + '35',
                        shadowColor: colors.primary,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={13} color={colors.primary} />
                    <Text style={[styles.tagText, { color: colors.foreground }]}>#{tag}</Text>
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
                    shadowColor: '#00000010',
                  },
                ]}
              >
                <MaterialCommunityIcons name={stat.icon} size={20} color={cfg.bgColor} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{post[stat.key]}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: bottomPad + 100 }} />
        </View>
      </ScrollView>

      {/* Action bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad + 12 },
        ]}
      >
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={21} color={colors.foreground} />
        </TouchableOpacity>

        {post.type === 'adoption' && (
          <TouchableOpacity
            style={[styles.chatBtn, { backgroundColor: '#2F80ED12', borderColor: '#2F80ED30' }]}
            onPress={handleOpenChat}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chat-outline" size={18} color="#2F80ED" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.mainActionBtn,
            { backgroundColor: cfg.bgColor, flex: 1, shadowColor: cfg.bgColor },
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
  imageContainer: { position: 'relative', height: 320 },
  image: { width: SCREEN_WIDTH, height: 320 },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareFloatBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: { position: 'absolute', bottom: 16, left: 16 },
  content: { padding: 20, gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleInfo: { flex: 1, gap: 4 },
  animalName: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  breedAge: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  likeBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  timeText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  authorName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  authorType: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  chatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 3,
  },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  description: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  tagText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  errorText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mainActionBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  mainActionText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  chatBtn: {
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2F80ED' },
});
