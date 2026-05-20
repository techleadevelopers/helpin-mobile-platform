import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { MOCK_CONVERSATIONS, MOCK_POSTS, POST_TYPE_CONFIG } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ANIMAL_PLACEHOLDERS: Record<string, string> = {
  dog:   'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=200&q=60',
  cat:   'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&q=60',
  other: 'https://images.unsplash.com/photo-1548767797-d8c844163c4a?w=200&q=60',
};

type Tab = 'curtidas' | 'posts' | 'conversas';

const TABS: Array<{ key: Tab; label: string; icon: MCIcon; color: string }> = [
  { key: 'curtidas',  label: 'Curtidas',   icon: 'heart',         color: '#FF6B6B' },
  { key: 'posts',     label: 'Meus posts', icon: 'paw',           color: '#4CAF50' },
  { key: 'conversas', label: 'Conversas',  icon: 'chat-outline',  color: '#2F80ED' },
];

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { likedPosts } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('curtidas');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const likedPostsList = MOCK_POSTS.filter((p) => likedPosts.includes(p.id));
  const recentPosts = MOCK_POSTS.slice(0, 6);
  const displayLiked = likedPostsList.length > 0 ? likedPostsList : MOCK_POSTS.slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Minha atividade</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Curtidas, posts e conversas recentes
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                isActive && [styles.tabBtnActive, { borderBottomColor: tab.color }],
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={16}
                color={isActive ? tab.color : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? tab.color : colors.mutedForeground },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
      >
        {/* ── CURTIDAS ── */}
        {activeTab === 'curtidas' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="heart" size={16} color="#FF6B6B" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Curtidas recentes</Text>
              <View style={[styles.countBadge, { backgroundColor: '#FF6B6B18' }]}>
                <Text style={[styles.countText, { color: '#FF6B6B' }]}>{displayLiked.length}</Text>
              </View>
            </View>
            {displayLiked.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[styles.activityRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                onPress={() => router.push(`/post/${post.id}`)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: ANIMAL_PLACEHOLDERS[post.animalType] }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {post.name}
                  </Text>
                  <View style={styles.rowMeta}>
                    <StatusBadge type={post.type} size="sm" />
                    <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>{post.createdAt}</Text>
                  </View>
                  <View style={styles.rowAuthor}>
                    <Avatar name={post.author.name} size={16} />
                    <Text style={[styles.rowAuthorName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {post.author.name}
                    </Text>
                  </View>
                </View>
                <View style={[styles.heartIcon, { backgroundColor: '#FF6B6B18' }]}>
                  <MaterialCommunityIcons name="heart" size={16} color="#FF6B6B" />
                </View>
              </TouchableOpacity>
            ))}
            {likedPostsList.length === 0 && (
              <View style={[styles.emptyHint, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="heart-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyHintText, { color: colors.mutedForeground }]}>
                  Você ainda nío curtiu nenhum post.{'\n'}Explore o feed e curta os animais!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── MEUS POSTS ── */}
        {activeTab === 'posts' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="paw" size={16} color="#4CAF50" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Publicações recentes</Text>
              <View style={[styles.countBadge, { backgroundColor: '#4CAF5018' }]}>
                <Text style={[styles.countText, { color: '#4CAF50' }]}>{recentPosts.length}</Text>
              </View>
            </View>
            {recentPosts.map((post) => {
              const cfg = POST_TYPE_CONFIG[post.type];
              return (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.activityRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                  onPress={() => router.push(`/post/${post.id}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: ANIMAL_PLACEHOLDERS[post.animalType] }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {post.name}
                    </Text>
                    <View style={styles.rowMeta}>
                      <StatusBadge type={post.type} size="sm" />
                      <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>{post.createdAt}</Text>
                    </View>
                    <View style={styles.rowStats}>
                      <MaterialCommunityIcons name="heart-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.rowStatNum, { color: colors.mutedForeground }]}>{post.likes}</Text>
                      <MaterialCommunityIcons name="comment-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.rowStatNum, { color: colors.mutedForeground }]}>{post.comments}</Text>
                      <MaterialCommunityIcons name="share-variant-outline" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.rowStatNum, { color: colors.mutedForeground }]}>{post.shares}</Text>
                    </View>
                  </View>
                  <View style={[styles.typeChip, { backgroundColor: cfg.bgColor }]}>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── CONVERSAS ── */}
        {activeTab === 'conversas' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chat-outline" size={16} color="#2F80ED" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conversas recentes</Text>
              <View style={[styles.countBadge, { backgroundColor: '#2F80ED18' }]}>
                <Text style={[styles.countText, { color: '#2F80ED' }]}>{MOCK_CONVERSATIONS.length}</Text>
              </View>
            </View>
            {MOCK_CONVERSATIONS.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.convRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                onPress={() => router.push(`/chat/${conv.id}`)}
                activeOpacity={0.9}
              >
                <Avatar name={conv.participant.name} size={44} verified={conv.participant.verified} />
                <View style={styles.convInfo}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.convName, { color: colors.foreground }]} numberOfLines={1}>
                      {conv.participant.name}
                    </Text>
                    <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                      {conv.lastMessageTime}
                    </Text>
                  </View>
                  <Text style={[styles.convPost, { color: colors.primary }]} numberOfLines={1}>
                    {conv.postTitle}
                  </Text>
                  <Text style={[styles.convLast, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                </View>
                {conv.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: '#2F80ED' }]}>
                    <Text style={styles.unreadText}>{conv.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  tabLabelActive: { fontFamily: 'Inter_600SemiBold' },

  scrollContent: { padding: 16, gap: 12 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { fontSize: 12, fontFamily: 'Inter_700Bold' },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  rowAuthor: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowAuthorName: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  rowStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowStatNum: { fontSize: 11, fontFamily: 'Inter_400Regular', marginRight: 4 },
  heartIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChip: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHint: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyHintText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },

  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  convInfo: { flex: 1, gap: 3 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  convTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  convPost: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  convLast: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
});
