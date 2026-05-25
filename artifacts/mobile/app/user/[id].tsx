import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { OperationalStatus } from '@/components/OperationalStatus';
import { StatusBadge } from '@/components/StatusBadge';
import { AUTHOR_TO_ONG, MOCK_AUTHORS, MOCK_ONGS, MOCK_POSTS, type Author, type Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { shareZooHelpItem } from '@/services/share';
import { createZooHelpApi } from '@/services/zoohelpApi';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type ProfileTab = 'posts' | 'active' | 'resolved' | 'about';
type SocialOverlay = 'followers' | 'following' | null;

const TAB_LABELS: Array<{ key: ProfileTab; label: string; icon: MCIcon }> = [
  { key: 'posts', label: 'Publicacoes', icon: 'grid' },
  { key: 'active', label: 'Ativos', icon: 'alert-circle-outline' },
  { key: 'resolved', label: 'Resolvidos', icon: 'check-circle-outline' },
  { key: 'about', label: 'Sobre', icon: 'information-outline' },
];

function formatCompactNumber(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return String(value);
}

function getAuthorLabel(type: Author['type']) {
  if (type === 'ong') return 'ONG';
  if (type === 'vet') return 'Veterinario';
  return 'Protetor';
}

function showsProtectorSince(type: Author['type']) {
  return type !== 'ong' && type !== 'vet';
}

function isResolved(post: Post) {
  return post.rescueStatus === 'resolved';
}

function isActive(post: Post) {
  return !isResolved(post) && (post.urgent || post.type === 'emergency' || post.type === 'lost' || post.type === 'found');
}

function formatCityState(city: string, state: string) {
  const cleanCity = city.trim().replace(/\s*-\s*$/g, '');
  const cleanState = state.trim().toUpperCase();
  if (!cleanCity || !/^[A-Z]{2}$/.test(cleanState)) return null;
  return `${cleanCity}-${cleanState}`;
}

function getStructuredCityState(post: Post) {
  if (!post.locationAddress) return null;
  return formatCityState(post.locationAddress.city, post.locationAddress.state);
}

function getAuthorLocation(posts: Post[]) {
  const firstWithLocation = posts.find((post) => post.locationAddress || post.location || post.neighborhood);
  const structuredLocation = firstWithLocation ? getStructuredCityState(firstWithLocation) : null;
  if (structuredLocation) return structuredLocation;
  // Usa apenas neighborhood se existir, senão usa location
  const locationText = firstWithLocation?.location || firstWithLocation?.neighborhood;
  if (!locationText) return 'Brasil';

  const parts = locationText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const stateIndex = parts.findIndex((part) => /^[A-Z]{2}$/i.test(part));
  const city = stateIndex > 0 ? parts[stateIndex - 1] : null;
  const state = stateIndex >= 0 ? parts[stateIndex].toUpperCase() : null;
  if (city && state) return `${city}-${state}`;

  const cityStatePart = parts.find((part) => /-\s*[A-Z]{2}$/i.test(part));
  if (cityStatePart) {
    const cityStateParts = cityStatePart.split('-').map((part) => part.trim()).filter(Boolean);
    const state = cityStateParts[cityStateParts.length - 1]?.toUpperCase();
    const city = cityStateParts[cityStateParts.length - 2];
    const formatted = city && state ? formatCityState(city, state) : null;
    if (formatted) return formatted;
  }

  return 'Brasil';
}

function getAuthorBio(author: Author, posts: Post[]) {
  const ong = MOCK_ONGS.find((item) => item.id === AUTHOR_TO_ONG[author.id]);
  if (ong) return ong.description;
  if (author.type === 'vet') return 'Atendimento, orientacao e apoio veterinario para casos que precisam de resposta rapida.';
  if (posts.some((post) => post.urgent)) return 'Protetor ativo na rede ZooHelp, compartilhando casos urgentes e pedidos de apoio.';
  return 'Perfil da comunidade ZooHelp, com publicacoes sobre resgate, adocao e cuidado animal.';
}

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { posts, user, followedUsers, toggleFollowUser } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [userSearch, setUserSearch] = useState('');
  const [socialOverlay, setSocialOverlay] = useState<SocialOverlay>(null);

  const allPosts = useMemo(() => {
    const merged = [...posts, ...MOCK_POSTS];
    const seen = new Set<string>();
    return merged.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [posts]);

  const profilePosts = allPosts.filter((post) => post.author.id === id);
  const searchableAuthors = useMemo(() => {
    const authors = [
      ...allPosts.map((post) => post.author),
      ...MOCK_AUTHORS,
      ...(user
        ? [{
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            verified: user.verified,
            type: user.type,
          }]
        : []),
    ];
    const byId = new Map<string, Author>();
    authors.forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  }, [allPosts, user]);
  const author =
    profilePosts[0]?.author ??
    MOCK_AUTHORS.find((item) => item.id === id) ??
    (user?.id === id
      ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          verified: user.verified,
          type: user.type,
        }
      : null);

  if (!author) {
    return (
      <View style={styles.emptyScreen}>
        <MaterialCommunityIcons name="account-off-outline" size={42} color="#8A928B" />
        <Text style={styles.emptyTitle}>Perfil nao encontrado</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.emptyButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activePosts = profilePosts.filter(isActive);
  const resolvedPosts = profilePosts.filter(isResolved);
  const location = getAuthorLocation(profilePosts);
  const bio = getAuthorBio(author, profilePosts);
  const following = followedUsers.includes(author.id);
  const followers = 1240 + author.id.charCodeAt(author.id.length - 1) * 37 + (following ? 1 : 0);
  const followingCount = author.type === 'ong' ? 86 : 142;
  const socialUsers = searchableAuthors
    .filter((item) => item.id !== author.id)
    .slice(0, socialOverlay === 'following' ? 6 : 8);
  const socialTitle = socialOverlay === 'following' ? 'Seguindo' : 'Seguidores';
  const socialCount = socialOverlay === 'following' ? followingCount : followers;
  const topPad = Platform.OS === 'web' ? 22 : insets.top + 8;
  const visiblePosts =
    activeTab === 'active' ? activePosts :
    activeTab === 'resolved' ? resolvedPosts :
    profilePosts;
  const searchResults = userSearch.trim().length >= 2
    ? searchableAuthors
        .filter((item) => item.id !== author.id)
        .filter((item) => item.name.toLowerCase().includes(userSearch.trim().toLowerCase()))
        .slice(0, 4)
    : [];

  function handleFollow() {
    toggleFollowUser(author.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleMessage() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const chatPost = activePosts[0] ?? profilePosts[0];
    const api = createZooHelpApi();
    const openedRoom = chatPost ? await api?.openChatRoom(chatPost.id).catch(() => null) : null;
    const rooms = !openedRoom ? await api?.chatRooms().catch(() => null) : null;
    const room =
      openedRoom ??
      rooms?.find((item) => item.participant.id === author.id);

    if (room) {
      router.push(
        `/chat/${room.id}?postName=${encodeURIComponent(room.postTitle)}&authorName=${encodeURIComponent(room.participant.name)}`
      );
      return;
    }

    Alert.alert('Chat indisponivel', 'Ainda nao existe uma conversa confirmada com este perfil.');
  }

  function handleShare() {
    shareZooHelpItem(author.name, `Veja o perfil de ${author.name} no ZooHelp.`);
  }

  function getSocialLocation(item: Author) {
    return getAuthorLocation(allPosts.filter((candidate) => candidate.author.id === item.id));
  }

  function openSocialProfile(item: Author) {
    setSocialOverlay(null);
    router.push({ pathname: '/(tabs)/user/[id]', params: { id: item.id } });
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <LinearGradient colors={['#F5F7F2', '#FFFFFF']} style={[styles.header, { paddingTop: topPad }]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={[styles.iconButton, styles.backButton]} onPress={() => router.back()} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#5F6861" />
            </TouchableOpacity>
            <View style={[styles.userSearchBox, styles.headerSearchBox]}>
              <MaterialCommunityIcons name="account-search-outline" size={15} color="#7C867C" />
              <TextInput
                style={styles.userSearchInput}
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Buscar usuario"
                placeholderTextColor="#8A928B"
                returnKeyType="search"
              />
            </View>
          </View>

          <View style={styles.profileHead}>
            <Avatar name={author.name} size={58} verified={author.verified} type={author.type} imageUrl={author.avatar} />
            <View style={styles.profileIdentity}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>{author.name}</Text>
              </View>
              <Text style={styles.role}>
                {getAuthorLabel(author.type)}
                {showsProtectorSince(author.type) && <Text style={styles.roleSince}>: Desde 05/2026</Text>}
              </Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#7C867C" />
                <Text style={styles.location} numberOfLines={1}>{location}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.iconButton, styles.profileShareButton]} onPress={handleShare} activeOpacity={0.8}>
              <MaterialCommunityIcons name="share-variant-outline" size={20} color="#1D2A20" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followButton, following && styles.followingButton]}
              onPress={handleFollow}
              activeOpacity={0.85}
            >
              <Text style={[styles.followText, following && styles.followingText]}>
                {following ? 'Seguindo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage} activeOpacity={0.85}>
              <MaterialCommunityIcons name="message-outline" size={17} color="#2D6A4F" />
              <Text style={styles.messageText}>Mensagem</Text>
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.userSearchResults}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.userSearchResult}
                  onPress={() => {
                    setUserSearch('');
                    router.push({ pathname: '/(tabs)/user/[id]', params: { id: item.id } });
                  }}
                  activeOpacity={0.82}
                >
                  <Avatar name={item.name} size={24} verified={item.verified} type={item.type} imageUrl={item.avatar} />
                  <View style={styles.userSearchResultInfo}>
                    <Text style={styles.userSearchResultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.userSearchResultRole}>{getAuthorLabel(item.type)}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={15} color="#A4AAA4" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profilePosts.length}</Text>
              <Text style={styles.statLabel}>publicacoes</Text>
            </View>
            <TouchableOpacity style={styles.statItem} onPress={() => setSocialOverlay('followers')} activeOpacity={0.82}>
              <Text style={styles.statValue}>{formatCompactNumber(followers)}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => setSocialOverlay('following')} activeOpacity={0.82}>
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>seguindo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bio}>{bio}</Text>
        </LinearGradient>

        <View style={styles.tabs}>
          {TAB_LABELS.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, selected && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name={tab.icon} size={17} color={selected ? '#2D6A4F' : '#8A928B'} />
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'about' ? (
          <View style={styles.aboutBlock}>
            <View style={styles.aboutIntro}>
              <View style={styles.aboutIconWrap}>
                <MaterialCommunityIcons name="account-heart-outline" size={18} color="#2D6A4F" />
              </View>
              <View style={styles.aboutIntroText}>
                <Text style={styles.aboutTitle}>Perfil da comunidade</Text>
                <Text style={styles.aboutText}>{bio}</Text>
              </View>
            </View>

            <View style={styles.aboutChips}>
              <View style={styles.aboutChip}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#5F6F63" />
                <Text style={styles.aboutChipText} numberOfLines={1}>{location}</Text>
              </View>
              <View style={styles.aboutChip}>
                <MaterialCommunityIcons name="shield-check-outline" size={13} color="#5F6F63" />
                <Text style={styles.aboutChipText}>{author.verified ? 'Verificado' : 'Comunidade'}</Text>
              </View>
            </View>

            <View style={styles.aboutMetrics}>
              <View style={styles.aboutMetric}>
                <MaterialCommunityIcons name="paw" size={15} color="#2D6A4F" />
                <Text style={styles.aboutMetricValue}>{activePosts.length}</Text>
                <Text style={styles.aboutMetricLabel}>ativos</Text>
              </View>
              <View style={styles.aboutMetric}>
                <MaterialCommunityIcons name="check-circle-outline" size={15} color="#2D6A4F" />
                <Text style={styles.aboutMetricValue}>{resolvedPosts.length}</Text>
                <Text style={styles.aboutMetricLabel}>resolvidos</Text>
              </View>
              <View style={styles.aboutMetric}>
                <MaterialCommunityIcons name="account-group-outline" size={15} color="#2D6A4F" />
                <Text style={styles.aboutMetricValue}>{formatCompactNumber(followers)}</Text>
                <Text style={styles.aboutMetricLabel}>seguidores</Text>
              </View>
            </View>
          </View>
        ) : visiblePosts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <MaterialCommunityIcons name="image-off-outline" size={30} color="#A4AAA4" />
            <Text style={styles.emptyPostsText}>Nenhuma publicacao nesta aba.</Text>
          </View>
        ) : (
          <View style={styles.postsList}>
            {visiblePosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postRow}
                onPress={() => router.push(`/post/${post.id}`)}
                activeOpacity={0.9}
              >
                {post.image ? (
                  <Image source={{ uri: post.image }} style={styles.postThumb} contentFit="cover" />
                ) : (
                  <View style={styles.postThumbFallback}>
                    <MaterialCommunityIcons name="text-box-outline" size={20} color="#8A928B" />
                  </View>
                )}
                <View style={styles.postInfo}>
                  <View style={styles.postTitleRow}>
                    <View style={styles.postAuthorIdentity}>
                      <Avatar
                        name={post.author.name}
                        size={18}
                        verified={post.author.verified}
                        type={post.author.type}
                        imageUrl={post.author.avatar}
                      />
                      <Text style={styles.postAuthorName} numberOfLines={1}>{post.author.name}</Text>
                    </View>
                    <StatusBadge type={post.type} urgent={post.urgent && !isResolved(post)} resolved={isResolved(post)} size="xs" hideType />
                  </View>
                  <Text style={styles.postDescription} numberOfLines={2}>{post.description}</Text>
                  <OperationalStatus post={post} variant="compact" />
                  <View style={styles.postMeta}>
                    <View style={styles.postEngagement}>
                      <MaterialCommunityIcons name="heart-outline" size={13} color="#6D766F" />
                      <Text style={styles.postMetaText}>{post.likes}</Text>
                      <MaterialCommunityIcons name="comment-outline" size={13} color="#6D766F" />
                      <Text style={styles.postMetaText}>{post.comments}</Text>
                    </View>
                    <View style={styles.postLocationInline}>
                      <MaterialCommunityIcons name="map-marker-outline" size={12} color="#7C867C" />
                      <Text style={styles.postLocationText} numberOfLines={1}>{post.neighborhood || post.location}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 28 }} />
      </ScrollView>

      <Modal transparent animationType="fade" visible={socialOverlay !== null} onRequestClose={() => setSocialOverlay(null)}>
        <View style={styles.socialOverlayRoot}>
          <TouchableOpacity style={styles.socialBackdrop} activeOpacity={1} onPress={() => setSocialOverlay(null)} />
          <BlurView intensity={64} tint="default" style={[styles.socialSheet, { height: height * 0.95, paddingBottom: insets.bottom + 14 }]}>
            <View pointerEvents="none" style={styles.socialSheetTint} />
            <View style={styles.socialHandle} />
            <View style={styles.socialHeader}>
              <View>
                <Text style={styles.socialTitle}>{socialTitle}</Text>
                <Text style={styles.socialSubtitle}>{formatCompactNumber(socialCount)} conexoes deste perfil</Text>
              </View>
              <TouchableOpacity style={styles.socialCloseButton} onPress={() => setSocialOverlay(null)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={18} color="#5F6861" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.socialList} contentContainerStyle={styles.socialListContent} showsVerticalScrollIndicator={false}>
              {socialUsers.map((item) => (
                <TouchableOpacity key={item.id} style={styles.socialRowTap} onPress={() => openSocialProfile(item)} activeOpacity={0.84}>
                  <BlurView intensity={48} tint="light" style={styles.socialRow}>
                    <View pointerEvents="none" style={styles.socialRowTint} />
                    <Avatar name={item.name} size={34} verified={item.verified} type={item.type} imageUrl={item.avatar} />
                    <View style={styles.socialInfo}>
                      <Text style={styles.socialName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.socialRole}>{getAuthorLabel(item.type)}</Text>
                    </View>
                    <View style={styles.socialLocation}>
                      <MaterialCommunityIcons name="map-marker-outline" size={12} color="#7C867C" />
                      <Text style={styles.socialLocationText} numberOfLines={1}>{getSocialLocation(item)}</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F2', padding: 24 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#1D2A20' },
  emptyButton: { marginTop: 18, paddingHorizontal: 18, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D6A4F' },
  emptyButtonText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  header: { paddingHorizontal: 18, paddingBottom: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 25 },
  iconButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  backButton: { width: 32, height: 32, borderRadius: 16 },
  profileHead: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  profileIdentity: { flex: 1, gap: 2, paddingRight: 42 },
  profileShareButton: { position: 'absolute', right: 20, top: 8, width: 36, height: 36, borderRadius: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#162018', letterSpacing: 0 },
  role: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  roleSince: { fontFamily: 'Montserrat_400Regular', color: '#7C867C' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { flex: 1, fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#7C867C' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 },
  followButton: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D6A4F' },
  followingButton: { backgroundColor: '#EAF3EC', borderWidth: 1, borderColor: '#CFE0D4' },
  followText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  followingText: { color: '#2D6A4F' },
  messageButton: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE4DD' },
  messageText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  userSearchBox: {
    minHeight: 34,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F4F6F3',
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  headerSearchBox: { flex: 1, marginTop: 0 },
  userSearchInput: {
    flex: 1,
    padding: 0,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#1D2A20',
  },
  userSearchResults: {
    marginTop: 7,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  userSearchResult: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  userSearchResultInfo: { flex: 1 },
  userSearchResultName: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  userSearchResultRole: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#7C867C', marginTop: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 9, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E4EAE5' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  statLabel: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: '#7C867C' },
  socialOverlayRoot: { flex: 1, justifyContent: 'flex-end' },
  socialBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,22,0.28)' },
  socialSheet: { marginHorizontal: 10, marginBottom: 10, paddingTop: 8, paddingHorizontal: 14, borderRadius: 22, overflow: 'hidden', shadowColor: '#244C35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 22, elevation: 8 },
  socialSheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42, 87, 58, 0.27)' },
  socialHandle: { alignSelf: 'center', width: 34, height: 4, borderRadius: 2, backgroundColor: 'rgba(239,247,241,0.68)', marginBottom: 12 },
  socialHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  socialTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#F3F7F4' },
  socialSubtitle: { marginTop: 2, fontSize: 10, fontFamily: 'Montserrat_500Medium', color: 'rgba(243,247,244,0.78)' },
  socialCloseButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,240,231,0.82)' },
  socialList: { flex: 1 },
  socialListContent: { gap: 6, paddingBottom: 8 },
  socialRowTap: { minHeight: 52, borderRadius: 16, overflow: 'hidden' },
  socialRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  socialRowTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(229,240,231,0.38)' },
  socialInfo: { flex: 1 },
  socialName: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  socialRole: { marginTop: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  socialLocation: { maxWidth: 106, minHeight: 24, paddingHorizontal: 7, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D7E9DA' },
  socialLocationText: { flex: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },
  bio: { marginTop: 10, fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#3D473F', lineHeight: 17 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    padding: 4,
    gap: 4,
    borderRadius: 18,
    backgroundColor: '#F4F7F3',
    borderWidth: 1,
    borderColor: '#E6ECE7',
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8DF',
  },
  tabText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#7E8880', lineHeight: 12 },
  tabTextActive: { color: '#2D6A4F' },
  postsList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 12, rowGap: 10, paddingTop: 2 },
  postRow: {
    width: '48.7%',
    gap: 8,
    padding: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EDE8',
    shadowColor: '#172018',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  postThumb: { width: '85%', aspectRatio: 1, alignSelf: 'center', borderRadius: 13, backgroundColor: '#E8ECF0' },
  postThumbFallback: { width: '85%', aspectRatio: 1, alignSelf: 'center', borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#182018' },
  postInfo: { flex: 1, gap: 5 },
  postTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postAuthorIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  postAuthorName: { flex: 1, fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  postDescription: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#626C65', lineHeight: 15 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  postEngagement: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  postMetaText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#6D766F', marginRight: 3 },
  postLocationInline: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 3 },
  postLocationText: { flex: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },
  aboutBlock: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#FBFCFA', borderWidth: 1, borderColor: '#E4EAE5', gap: 12 },
  aboutIntro: { flexDirection: 'row', gap: 11 },
  aboutIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3EC' },
  aboutIntroText: { flex: 1, gap: 3 },
  aboutTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  aboutText: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#4E5A51', lineHeight: 18 },
  aboutChips: { flexDirection: 'row', gap: 7 },
  aboutChip: { flex: 1, minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F6F2' },
  aboutChipText: { flex: 1, fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#5F6F63' },
  aboutMetrics: { flexDirection: 'row', gap: 8 },
  aboutMetric: { flex: 1, minHeight: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: '#F6F8F5', borderWidth: 1, borderColor: '#E8EDE8' },
  aboutMetricValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  aboutMetricLabel: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#7C867C' },
  emptyPosts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 42, gap: 8 },
  emptyPostsText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
});
