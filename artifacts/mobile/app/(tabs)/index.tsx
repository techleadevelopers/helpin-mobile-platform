import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
import { OngDashboard } from '@/components/OngDashboard';
import { PostCard } from '@/components/PostCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { MOCK_AUTHORS, Post, PostType } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type FeedFilter = PostType | 'all' | 'ong';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const FILTERS: Array<{ label: string; value: FeedFilter; icon: MCIcon; color: string; activeBg: string }> = [
  { label: 'Todos',       value: 'all',       icon: 'paw',               color: '#4CAF50', activeBg: '#586158' },
  { label: 'Adoção',      value: 'adoption',  icon: 'home-heart',        color: '#4CAF50', activeBg: '#586158' },
  { label: 'Perdidos',    value: 'lost',       icon: 'magnify',           color: '#FF9800', activeBg: '#586158' },
  { label: 'Encontrados', value: 'found',      icon: 'check-circle',      color: '#2F80ED', activeBg: '#586158' },
  { label: 'Emergência',  value: 'emergency',  icon: 'alert-circle',      color: '#FF3B30', activeBg: '#586158' },
  { label: 'Campanhas',   value: 'campaign',   icon: 'heart-multiple',    color: '#9B59B6', activeBg: '#586158' },
  { label: 'ONGs',        value: 'ong',        icon: 'shield-check',      color: '#2F80ED', activeBg: '#586158' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Post>);

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, refreshPosts, user, addPost, pendingOutboxCount, syncPendingOperations } = useApp();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [quickImage, setQuickImage] = useState<string | null>(null);
  const [quickUrgent, setQuickUrgent] = useState(true);
  const [quickLocation, setQuickLocation] = useState('');
  const [quickCoords, setQuickCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const quickInputRef = useRef<TextInput>(null);

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
    await syncPendingOperations().catch(() => {});
    await refreshPosts().catch(() => {});
    setRefreshing(false);
  }, [refreshPosts, syncPendingOperations]);

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

  const displayName = user?.name?.split(' ')[0] ?? 'Conta';

  if (user?.type === 'ong') {
    return <OngDashboard />;
  }

  async function pickQuickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (!result.canceled) {
      setQuickImage(result.assets[0]?.uri ?? null);
    }
  }

  async function detectQuickLocation() {
    if (Platform.OS === 'web') {
      Alert.alert('Localizacao', 'GPS real esta disponivel no app mobile. No web, use a publicacao completa.');
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permissao de localizacao', 'Ative a localizacao para alertar ONGs e pessoas proximas.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setQuickCoords({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    setQuickLocation('Localizacao atual');
  }

  async function handleQuickPost() {
    const description = quickText.trim();
    if (!description && !quickImage) {
      quickInputRef.current?.focus();
      return;
    }

    let coords = quickCoords;
    let location = quickLocation;
    if (!coords && Platform.OS === 'web') {
      Alert.alert('Localizacao obrigatoria', 'Para pedir ajuda real, use o app mobile com GPS ativo.');
      return;
    }

    if (!coords) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Localizacao obrigatoria', 'Para pedir ajuda real, permita o GPS. Assim o sistema alerta pessoas e ONGs proximas.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setQuickCoords(coords);
      location = 'Localizacao atual';
      setQuickLocation(location);
    }

    setQuickSubmitting(true);
    location = location || 'Localizacao atual';
    const post: Post = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      type: 'emergency',
      animalType: 'other',
      name: description.split(' ').slice(0, 3).join(' ') || 'Pedido de ajuda',
      breed: '',
      age: '',
      description: description || 'Pedido rapido de ajuda para animal proximo.',
      location,
      neighborhood: location,
      image: quickImage,
      images: quickImage ? [quickImage] : [],
      textOnly: !quickImage,
      author: user
        ? { id: user.id, name: user.name, avatar: user.avatar, verified: user.verified, type: user.type }
        : MOCK_AUTHORS[4],
      likes: 0,
      comments: 0,
      shares: 0,
      urgent: quickUrgent,
      createdAt: 'agora',
      contact: '',
      tags: quickUrgent ? ['ajuda', 'urgente'] : ['ajuda'],
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };

    try {
      const savedPost = await addPost(post);
      setQuickText('');
      setQuickImage(null);
      setQuickLocation('');
      setQuickCoords(null);
      setQuickUrgent(true);
      setActiveFilter('all');
      router.push(`/rescue/status?postId=${encodeURIComponent(savedPost.id)}` as any);
    } catch {
      Alert.alert('Erro ao publicar', 'Nao foi possivel publicar agora. Tente novamente.');
    } finally {
      setQuickSubmitting(false);
    }
  }

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
              onPress={() => router.push('/search')}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={colors.foreground} />
            </TouchableOpacity>
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

        {/* Quick help composer */}
        <View
          style={[
            styles.quickPostCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.quickPostTop}>
            <View style={[styles.quickPostAvatar, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons name="paw" size={20} color={colors.primary} />
            </View>
            <View style={[styles.quickInputShell, { backgroundColor: colors.muted }]}>
              <TextInput
                ref={quickInputRef}
                style={[styles.quickInput, { color: colors.foreground }]}
                value={quickText}
                onChangeText={setQuickText}
                placeholder="Escreva algo..."
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="send"
                onSubmitEditing={handleQuickPost}
              />
            </View>
          </View>

          <View style={styles.quickPostBottom}>
            <View style={styles.quickPostTools}>
              <TouchableOpacity
                style={[styles.quickTool, { backgroundColor: quickImage ? colors.primary + '18' : colors.muted }]}
                onPress={pickQuickImage}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="image-outline" size={16} color={quickImage ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickTool, { backgroundColor: quickLocation ? colors.primary + '18' : colors.muted }]}
                onPress={detectQuickLocation}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={quickLocation ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickTool, { backgroundColor: quickUrgent ? '#FF3B3014' : colors.muted }]}
                onPress={() => setQuickUrgent((prev) => !prev)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={quickUrgent ? '#FF3B30' : colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickTool, { backgroundColor: colors.muted }]}
                onPress={() => router.push('/compose?intent=help&type=emergency&rescue=1')}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="dots-horizontal" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.quickPostCta, { backgroundColor: colors.primary, opacity: quickSubmitting ? 0.65 : 1 }]}
              onPress={handleQuickPost}
              disabled={quickSubmitting}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons name="send" size={13} color="#FFFFFF" />
              <Text style={styles.quickPostCtaText}>{quickSubmitting ? 'Enviando' : 'Pedir ajuda'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.opsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.opsStripLeft}>
          <View style={[styles.liveDot, { backgroundColor: pendingOutboxCount ? '#D4A259' : '#2D6A4F' }]} />
          <Text style={[styles.opsStripTitle, { color: colors.foreground }]}>
            {pendingOutboxCount ? `${pendingOutboxCount} envio${pendingOutboxCount > 1 ? 's' : ''} pendente${pendingOutboxCount > 1 ? 's' : ''}` : 'Rede operacional ativa'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => syncPendingOperations()} activeOpacity={0.75}>
          <Text style={[styles.opsStripAction, { color: colors.primary }]}>Sincronizar</Text>
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
    paddingBottom: 8,
    gap: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  headerLeft: {
    gap: 1,
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 25,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -1,
    lineHeight: 31,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  quickPostCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  quickPostTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickPostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInputShell: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  quickInput: {
    flex: 1,
    padding: 0,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  quickPostBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickPostTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickTool: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPostCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  quickPostCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 7,
    paddingBottom: 8,
    paddingTop: 4,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 18,
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
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
  },
  listContent: {
    paddingBottom: 0,
  },
  opsStrip: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opsStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  opsStripTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  opsStripAction: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
});
