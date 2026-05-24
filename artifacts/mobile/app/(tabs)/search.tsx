import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { PostCard } from '@/components/PostCard';
import { MOCK_AUTHORS, MOCK_ONGS, type Author, type ONG, type Post } from '@/constants/data';
import { useColors } from '@/hooks/useColors';
import { createZooHelpApi, mapPost } from '@/services/zoohelpApi';

type SearchItem =
  | { type: 'user'; user: Author }
  | { type: 'ong'; ong: ONG }
  | { type: 'post'; post: Post };

function getAuthorLabel(type: Author['type']) {
  if (type === 'ong') return 'ONG';
  if (type === 'vet') return 'Veterinario';
  return 'Protetor(a)';
}

function UserSearchCard({ user, onPress }: { user: Author; onPress: () => void }) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Avatar name={user.name} size={42} verified={user.verified} type={user.type} imageUrl={user.avatar} />
      <View style={styles.userBody}>
        <View style={styles.ongTitleRow}>
          <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
            {user.name}
          </Text>
          {user.verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#6F8583" />}
        </View>
        <Text style={[styles.userMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {getAuthorLabel(user.type)}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function OngSearchCard({ ong, onPress }: { ong: ONG; onPress: () => void }) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.ongCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.ongIconWrap}>
        <MaterialCommunityIcons name="domain" size={20} color="#4CAF50" />
      </View>
      <View style={styles.ongBody}>
        <View style={styles.ongTitleRow}>
          <Text style={[styles.ongName, { color: colors.foreground }]} numberOfLines={1}>
            {ong.name}
          </Text>
          {ong.verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#2F80ED" />}
        </View>
        <Text style={[styles.ongMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {ong.city}, {ong.state} - {ong.cause}
        </Text>
        <Text style={[styles.ongDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {ong.description}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(q ?? '');
  const [results, setResults] = useState<Post[]>([]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }

  const term = query.trim().toLowerCase();
  const userResults = term
    ? MOCK_AUTHORS.filter((user) =>
        [user.name, getAuthorLabel(user.type)]
          .some((value) => value.toLowerCase().includes(term))
      ).slice(0, 4)
    : MOCK_AUTHORS.slice(0, 4);
  const ongResults = term
    ? MOCK_ONGS.filter((ong) =>
        [ong.name, ong.shortName, ong.description, ong.cause, ong.city, ong.state, ong.location]
          .some((value) => value.toLowerCase().includes(term))
      )
    : [];
  const searchItems: SearchItem[] = [
    ...userResults.map((user) => ({ type: 'user' as const, user })),
    ...ongResults.map((ong) => ({ type: 'ong' as const, ong })),
    ...results.map((post) => ({ type: 'post' as const, post })),
  ];

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      const api = createZooHelpApi();
      api?.search(term)
        .then((data) => setResults(data.posts.map(mapPost)))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <View style={[styles.root, { paddingTop: (Platform.OS === 'web' ? 0 : insets.top) + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.round} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={21} color="#1D2A20" />
        </TouchableOpacity>
        <View style={styles.search}>
          <MaterialCommunityIcons name="magnify" size={16} color="#6F8583" />
          <TextInput
            style={styles.input}
            placeholder="Buscar animais, ONGs, campanhas..."
            placeholderTextColor="#5D6B63"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>
      <FlatList
        data={searchItems}
        keyExtractor={(item) =>
          item.type === 'user'
            ? `user-${item.user.id}`
            : item.type === 'ong'
              ? `ong-${item.ong.id}`
              : `post-${item.post.id}`
        }
        renderItem={({ item, index }) =>
          item.type === 'user'
            ? <UserSearchCard user={item.user} onPress={() => router.push(`/user/${item.user.id}`)} />
            : item.type === 'ong'
            ? <OngSearchCard ong={item.ong} onPress={() => router.push(`/ong/${item.ong.id}`)} />
            : <PostCard post={item.post} index={index} />
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            {query.trim() ? 'Nenhum resultado encontrado.' : 'Digite para buscar no ZooHelp.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7F2' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF4EF' },
  search: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE5DF',
  },
  input: { flex: 1, padding: 0, fontSize: 14, fontFamily: 'Montserrat_500Medium', color: '#1D2A20' },
  empty: { textAlign: 'center', marginTop: 64, fontSize: 15, fontFamily: 'Inter_400Regular' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  userBody: { flex: 1 },
  userName: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_700Bold' },
  userMeta: { fontSize: 11, fontFamily: 'Montserrat_500Medium', marginTop: 2 },
  ongCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  ongIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF5014',
  },
  ongBody: { flex: 1 },
  ongTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ongName: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },
  ongMeta: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  ongDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: 5 },
});
