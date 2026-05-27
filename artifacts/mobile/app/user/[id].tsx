import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ProfileTabs,
  PublicUserHeader,
  SocialOverlaySheet,
  UserAboutBlock,
  UserPostGrid,
  type ProfileTab,
  type SocialOverlayType,
} from '@/components/user';
import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import { AUTHOR_TO_ONG, MOCK_AUTHORS, MOCK_ONGS, MOCK_POSTS, type Author, type Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { shareZooHelpItem } from '@/services/share';
import { createZooHelpApi } from '@/services/zoohelpApi';

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
  // Usa apenas neighborhood se existir, senao usa location
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
  if (author.type === 'vet') return 'Atendimento, orientação e apoio veterinario para casos que precisam de resposta rapida.';
  if (posts.some((post) => post.urgent)) return 'Protetor ativo na rede ZooHelp, compartilhando casos urgentes e pedidos de apoio.';
  return 'Perfil da comunidade ZooHelp, com publicacoes sobre resgate, adoção e cuidado animal.';
}

export default function PublicUserProfileScreen() {
  const { id, profileName, profileAvatar, profileVerified, profileType } = useLocalSearchParams<{
    id: string;
    profileName?: string;
    profileAvatar?: string;
    profileVerified?: string;
    profileType?: Author['type'];
  }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { posts, user, followedUsers, toggleFollowUser } = useApp();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [userSearch, setUserSearch] = useState('');
  const [socialOverlay, setSocialOverlay] = useState<SocialOverlayType>(null);

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
  const routedAuthor: Author | null =
    profileName && (profileType === 'person' || profileType === 'ong' || profileType === 'vet')
      ? {
          id,
          name: profileName,
          avatar: profileAvatar || null,
          verified: profileVerified === 'true',
          type: profileType,
        }
      : null;
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
      : routedAuthor);

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
  const socialCount = socialOverlay === 'following' ? followingCount : followers;
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

    const api = createZooHelpApi();
    const rooms = await api?.chatRooms().catch(() => null);
    const existingRoom = rooms?.find((item) => item.participant.id === author.id);
    const room = existingRoom ?? await api?.openDirectChat(author.id).catch(() => null);

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
        <ZooHelpHeader />
        <PublicUserHeader
          author={author}
          location={location}
          bio={bio}
          userSearch={userSearch}
          searchResults={searchResults}
          following={following}
          followers={followers}
          followingCount={followingCount}
          postsCount={profilePosts.length}
          onChangeSearch={setUserSearch}
          onFollow={handleFollow}
          onMessage={handleMessage}
          onShare={handleShare}
          onOpenSearchResult={(item) => {
            setUserSearch('');
            router.push({ pathname: '/(tabs)/user/[id]', params: { id: item.id } });
          }}
          onOpenFollowers={() => setSocialOverlay('followers')}
          onOpenFollowing={() => setSocialOverlay('following')}
          getAuthorLabel={getAuthorLabel}
          showsProtectorSince={showsProtectorSince}
          formatCompactNumber={formatCompactNumber}
        />

        <ProfileTabs activeTab={activeTab} onChangeTab={setActiveTab} />

        {activeTab === 'about' ? (
          <UserAboutBlock
            bio={bio}
            location={location}
            verified={author.verified}
            activePostsCount={activePosts.length}
            resolvedPostsCount={resolvedPosts.length}
            followers={followers}
            formatCompactNumber={formatCompactNumber}
          />
        ) : (
          <UserPostGrid
            posts={visiblePosts}
            onOpenPost={(post) => router.push(`/post/${post.id}`)}
            isResolved={isResolved}
          />
        )}

        <View style={{ height: insets.bottom + 28 }} />
      </ScrollView>

      <SocialOverlaySheet
        visible={socialOverlay !== null}
        overlay={socialOverlay}
        height={height}
        bottomInset={insets.bottom}
        users={socialUsers}
        count={socialCount}
        onClose={() => setSocialOverlay(null)}
        onOpenProfile={openSocialProfile}
        getAuthorLabel={getAuthorLabel}
        getSocialLocation={getSocialLocation}
        formatCompactNumber={formatCompactNumber}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F2', padding: 24 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#1D2A20' },
  emptyButton: { marginTop: 18, paddingHorizontal: 18, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D6A4F' },
  emptyButtonText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});

