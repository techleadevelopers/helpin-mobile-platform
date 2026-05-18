import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/PostCard';
import { MOCK_POSTS, Post } from '@/constants/data';
import { useColors } from '@/hooks/useColors';
import { createZooHelpApi, mapPost } from '@/services/zoohelpApi';

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(q ?? '');
  const [results, setResults] = useState<Post[]>([]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const api = createZooHelpApi();
    api?.search(term)
      .then((data) => setResults(data.posts.map(mapPost)))
      .catch(() => {
        const lower = term.toLowerCase();
        setResults(MOCK_POSTS.filter((post) =>
          [post.name, post.description, post.location, post.neighborhood, ...post.tags]
            .join(' ')
            .toLowerCase()
            .includes(lower),
        ));
      });
  }, [query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Buscar animais, ONGs, campanhas..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
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
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  empty: { textAlign: 'center', marginTop: 64, fontSize: 15, fontFamily: 'Inter_400Regular' },
});
