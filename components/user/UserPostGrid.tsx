import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { OperationalStatus } from '@/components/OperationalStatus';
import { StatusBadge } from '@/components/StatusBadge';
import type { Post } from '@/constants/data';

type UserPostGridProps = {
  posts: Post[];
  onOpenPost: (post: Post) => void;
  isResolved: (post: Post) => boolean;
};

export function UserPostGrid({ posts, onOpenPost, isResolved }: UserPostGridProps) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyPosts}>
        <MaterialCommunityIcons name="image-off-outline" size={30} color="#A4AAA4" />
        <Text style={styles.emptyPostsText}>Nenhuma publicação nesta aba.</Text>
      </View>
    );
  }

  return (
    <View style={styles.postsList}>
      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          style={styles.postRow}
          onPress={() => onOpenPost(post)}
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
  );
}

const styles = StyleSheet.create({
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
  emptyPosts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 42, gap: 8 },
  emptyPostsText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
});

