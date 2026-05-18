import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { PostCard } from '@/components/PostCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Post, PostType } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type FeedFilter = PostType | 'all' | 'ong';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const FILTERS: Array<{ label: string; value: FeedFilter; icon: MCIcon; color: string; activeBg: string }> = [
  { label: 'Todos',       value: 'all',       icon: 'paw',               color: '#4CAF50', activeBg: '#6EC270' },
  { label: 'Adoção',      value: 'adoption',  icon: 'home-heart',        color: '#4CAF50', activeBg: '#6EC270' },
  { label: 'Perdidos',    value: 'lost',       icon: 'magnify',           color: '#FF9800', activeBg: '#FFB347' },
  { label: 'Encontrados', value: 'found',      icon: 'check-circle',      color: '#2F80ED', activeBg: '#5B9FEE' },
  { label: 'Emergência',  value: 'emergency',  icon: 'alert-circle',      color: '#FF3B30', activeBg: '#FF6B6B' },
  { label: 'Campanhas',   value: 'campaign',   icon: 'heart-multiple',    color: '#9B59B6', activeBg: '#B07CC7' },
  { label: 'ONGs',        value: 'ong',        icon: 'shield-check',      color: '#2F80ED', activeBg: '#5B9FEE' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Post>);

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, refreshPosts, user } = useApp();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading] = useState(false);

  const scrollY = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      scrollY.value = 0;
    }, [])
  );

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0], 'clamp');
    const translateY = interpolate(scrollY.value, [0, 60], [0, -8], 'clamp');
    return { opacity, transform: [{ translateY }] };
  });

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'ong') return posts.filter((p) => p.author.type === 'ong');
    return posts.filter((p) => p.type === (activeFilter as PostType));
  }, [posts, activeFilter]);

  function handleFilterPress(value: FeedFilter) {
    if (value === 'ong') {
      router.push('/ongs');
      return;
    }
    setActiveFilter(value);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshPosts();
    await new Promise((r) => setTimeout(r, 900));
    setRefreshing(false);
  }, [refreshPosts]);

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => <PostCard post={item} index={index} />,
    []
  );
  const keyExtractor = useCallback((item: Post) => item.id, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const displayName = user?.name?.split(' ')[0] ?? 'Visitante';

  const ListHeader = (
    <View>
      {/* ── Main Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Animated.View style={[styles.headerTop, headerAnimStyle]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greeting}, {displayName}
            </Text>
            <View style={styles.logoRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoIcon}
                resizeMode="contain"
              />
              <Text style={[styles.logoText, { color: colors.primary }]}>ZooHelp</Text>
            </View>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Ajude animais perto de você
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.muted }]}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="bell-outline" size={18} color={colors.foreground} />
              <View style={[styles.notifDot, { backgroundColor: '#FF3B30' }]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.85}
            >
              <Avatar name={displayName} size={38} verified={user?.verified} bgColor="#4CAF50" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Search pill */}
        <TouchableOpacity
          style={[
            styles.searchPill,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push('/search')}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="magnify" size={16} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Buscar animais, ONGs, campanhas...
          </Text>
          <View style={[styles.searchFilterBtn, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name="tune-variant" size={14} color={colors.foreground} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Filter chips ── */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f.value}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: f }) => {
          const isActive = activeFilter === f.value;
          const textColor = isActive ? '#FFFFFF' : colors.mutedForeground;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? f.activeBg : colors.card,
                  borderColor: isActive ? f.color : colors.border,
                  shadowColor: isActive ? f.color : '#00000018',
                },
              ]}
              onPress={() => handleFilterPress(f.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: textColor }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Section heading ── */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {activeFilter === 'all' ? 'Casos recentes' :
           activeFilter === 'adoption' ? 'Para adoção' :
           activeFilter === 'lost' ? 'Animais perdidos' :
           activeFilter === 'found' ? 'Animais encontrados' :
           activeFilter === 'emergency' ? 'Emergências' : 'Campanhas'}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
          {filteredPosts.length} casos
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {ListHeader}
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedFlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="paw-off"
            title="Nenhum caso encontrado"
            subtitle="Tente um filtro diferente ou puxe para atualizar."
            actionLabel="Ver todos"
            iconColor="#4CAF50"
            onAction={() => setActiveFilter('all')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 1,
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    lineHeight: 34,
  },
  tagline: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#F8FAF8',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  searchFilterBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
    paddingTop: 6,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingBottom: 0,
  },
});
