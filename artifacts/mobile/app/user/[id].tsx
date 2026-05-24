import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { AUTHOR_TO_ONG, MOCK_AUTHORS, MOCK_ONGS, MOCK_POSTS, type Author, type Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { shareZooHelpItem } from '@/services/share';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type ProfileTab = 'posts' | 'active' | 'resolved' | 'about';

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

function isResolved(post: Post) {
  return post.rescueStatus === 'resolved';
}

function isActive(post: Post) {
  return !isResolved(post) && (post.urgent || post.type === 'emergency' || post.type === 'lost' || post.type === 'found');
}

function getAuthorLocation(posts: Post[]) {
  const firstWithLocation = posts.find((post) => post.neighborhood || post.location);
  // Usa apenas neighborhood se existir, senão usa location
  const locationText = firstWithLocation?.neighborhood || firstWithLocation?.location;
  return locationText || 'Brasil';
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
  const router = useRouter();
  const { posts, user, followedUsers, toggleFollowUser } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [userSearch, setUserSearch] = useState('');

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

  function handleMessage() {
    Alert.alert('Mensagem', 'O chat direto do perfil sera conectado ao backend de conversas.');
  }

  function handleShare() {
    shareZooHelpItem(author.name, `Veja o perfil de ${author.name} no ZooHelp.`);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <LinearGradient colors={['#F5F7F2', '#FFFFFF']} style={[styles.header, { paddingTop: topPad }]}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={21} color="#1D2A20" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.8}>
              <MaterialCommunityIcons name="share-variant-outline" size={19} color="#1D2A20" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileHead}>
            <Avatar name={author.name} size={58} verified={author.verified} type={author.type} imageUrl={author.avatar} />
            <View style={styles.profileIdentity}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>{author.name}</Text>
                {author.verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#6F8583" />}
              </View>
              <Text style={styles.role}>{getAuthorLabel(author.type)}</Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={13} color="#7C867C" />
                <Text style={styles.location} numberOfLines={1}>{location}</Text>
              </View>
            </View>
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

          <View style={styles.userSearchBox}>
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
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCompactNumber(followers)}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>seguindo</Text>
            </View>
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
                <MaterialCommunityIcons name={tab.icon} size={16} color={selected ? '#2D6A4F' : '#8A928B'} />
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'about' ? (
          <View style={styles.aboutBlock}>
            <Text style={styles.aboutText}>{bio}</Text>
            <View style={styles.aboutLine}>
              <MaterialCommunityIcons name="paw" size={15} color="#2D6A4F" />
              <Text style={styles.aboutLineText}>{activePosts.length} casos ativos acompanhados</Text>
            </View>
            <View style={styles.aboutLine}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color="#2D6A4F" />
              <Text style={styles.aboutLineText}>{resolvedPosts.length} casos resolvidos publicados</Text>
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
                    <Text style={styles.postTitle} numberOfLines={1}>{post.name}</Text>
                    <StatusBadge type={post.type} urgent={post.urgent && !isResolved(post)} resolved={isResolved(post)} size="sm" hideType />
                  </View>
                  <Text style={styles.postDescription} numberOfLines={2}>{post.description}</Text>
                  <View style={styles.postMeta}>
                    <MaterialCommunityIcons name="heart-outline" size={13} color="#7C867C" />
                    <Text style={styles.postMetaText}>{post.likes}</Text>
                    <MaterialCommunityIcons name="comment-outline" size={13} color="#7C867C" />
                    <Text style={styles.postMetaText}>{post.comments}</Text>
                    <Text style={styles.postMetaText}>{post.neighborhood}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 28 }} />
      </ScrollView>
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.86)' },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  profileIdentity: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flex: 1, fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#162018', letterSpacing: 0 },
  role: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
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
  bio: { marginTop: 10, fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#3D473F', lineHeight: 17 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, gap: 6, backgroundColor: '#FFFFFF' },
  tabButton: { flex: 1, minHeight: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: '#F4F6F3' },
  tabButtonActive: { backgroundColor: '#EAF3EC' },
  tabText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#8A928B' },
  tabTextActive: { color: '#2D6A4F' },
  postsList: { paddingHorizontal: 14, gap: 10, paddingTop: 4 },
  postRow: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 16, backgroundColor: '#F7F8F5', borderWidth: 1, borderColor: '#E8EDE8' },
  postThumb: { width: 82, height: 82, borderRadius: 12, backgroundColor: '#E8ECF0' },
  postThumbFallback: { width: 82, height: 82, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDF0EC' },
  postInfo: { flex: 1, gap: 5 },
  postTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postTitle: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  postDescription: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#5D665E', lineHeight: 16 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  postMetaText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C', marginRight: 5 },
  aboutBlock: { margin: 14, padding: 16, borderRadius: 18, backgroundColor: '#F7F8F5', borderWidth: 1, borderColor: '#E8EDE8', gap: 10 },
  aboutTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  aboutText: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: '#4E5A51', lineHeight: 19 },
  aboutLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  aboutLineText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#4E5A51' },
  emptyPosts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 42, gap: 8 },
  emptyPostsText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
});
