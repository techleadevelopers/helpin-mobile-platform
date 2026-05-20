import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/PostCard';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function FavoritesScreen() {
  const { posts, likedPosts } = useApp();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const favorites = posts.filter((post) => likedPosts.includes(post.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 12 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Meus favoritos</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>Você ainda nío favoritou nenhum caso.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  empty: { textAlign: 'center', marginTop: 64, fontSize: 15, fontFamily: 'Inter_400Regular' },
});
