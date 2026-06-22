import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Post } from '@/constants/data';
import { useColors } from '@/hooks/useColors';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=700&q=85';

function storyScore(post: Post) {
  if (post.rescueStatus === 'resolved') return 0;
  if (post.rescueFinalReport?.publicUpdate) return 1;
  if (post.type === 'found') return 2;
  return 3;
}

function storyTitle(post: Post) {
  if (post.rescueStatus === 'resolved') return `${post.name || 'Caso'} resolvido`;
  if (post.type === 'found') return `${post.name || 'Animal'} encontrado`;
  return post.name || 'Historia Helpin';
}

function storyCopy(post: Post) {
  if (post.rescueFinalReport?.publicUpdate) return post.rescueFinalReport.publicUpdate;
  if (post.rescueStatus === 'resolved') return 'Caso encerrado com apoio da comunidade.';
  if (post.type === 'found') return 'Animal localizado e visivel para tutores proximos.';
  return post.description;
}

export function ResolvedStoriesStrip({ posts }: { posts: Post[] }) {
  const colors = useColors();
  const router = useRouter();
  const stories = useMemo(() => {
    const candidates = posts
      .filter((post) => post.rescueStatus === 'resolved' || !!post.rescueFinalReport?.publicUpdate || post.type === 'found')
      .sort((a, b) => storyScore(a) - storyScore(b))
      .slice(0, 6);
    return candidates;
  }, [posts]);

  if (stories.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingLeft}>
          <MaterialCommunityIcons name="check-decagram-outline" size={15} color={colors.primary} />
          <Text style={[styles.heading, { color: colors.foreground }]}>Historias resolvidas</Text>
        </View>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>animais encontrados e resgatados</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
        {stories.map((post) => {
          const imageUri = post.images?.[0] ?? post.image ?? FALLBACK_IMAGE;
          const resolved = post.rescueStatus === 'resolved' || !!post.rescueFinalReport?.publicUpdate;
          return (
            <TouchableOpacity
              key={post.id}
              style={[styles.storyCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => router.push(`/post/${post.id}`)}
              activeOpacity={0.84}
            >
              <Image source={{ uri: imageUri }} style={styles.storyImage} contentFit="cover" />
              <View style={styles.storyBody}>
                <View style={[styles.badge, { backgroundColor: resolved ? '#EAF3EC' : '#FFF4E4' }]}>
                  <MaterialCommunityIcons
                    name={resolved ? 'check-circle-outline' : 'map-marker-check-outline'}
                    size={10}
                    color={resolved ? '#2D6A4F' : '#B56B12'}
                  />
                  <Text style={[styles.badgeText, { color: resolved ? '#2D6A4F' : '#B56B12' }]}>
                    {resolved ? 'Resolvido' : 'Encontrado'}
                  </Text>
                </View>
                <Text style={[styles.storyTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {storyTitle(post)}
                </Text>
                <Text style={[styles.storyText, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {storyCopy(post)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 9,
  },
  headingRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
  },
  headingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  heading: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  caption: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
  },
  storyRow: {
    gap: 8,
    paddingHorizontal: 10,
  },
  storyCard: {
    width: 210,
    minHeight: 92,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  storyImage: {
    width: 74,
    height: '100%',
    minHeight: 92,
    backgroundColor: '#E8ECE8',
  },
  storyBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    minHeight: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
  },
  storyTitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  storyText: {
    fontSize: 9.5,
    lineHeight: 13,
    fontFamily: 'Montserrat_500Medium',
  },
});
