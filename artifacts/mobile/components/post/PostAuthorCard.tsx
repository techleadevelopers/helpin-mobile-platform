import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { Post } from '@/constants/data';

type Colors = {
  primary: string;
  foreground: string;
  muted: string;
};

export function PostAuthorCard({
  post,
  colors,
  followingAuthor,
  onPressAuthor,
  onToggleFollowing,
}: {
  post: Post;
  colors: Colors;
  followingAuthor: boolean;
  onPressAuthor: () => void;
  onToggleFollowing: () => void;
}) {
  const isOrg = post.author.type === 'ong' || post.author.type === 'vet';
  const authorLabel =
    post.author.type === 'ong' ? 'ONG' :
    post.author.type === 'vet' ? 'VeterinÃ¡rio' : 'Protetor';
  const showsProtectorSince = !isOrg;

  return (
    <TouchableOpacity
      style={[
        styles.authorCard,
        {
          backgroundColor: colors.muted + '80',
          borderColor: isOrg ? colors.primary + '20' : 'transparent',
          borderWidth: isOrg ? 0.5 : 0,
        },
      ]}
      onPress={onPressAuthor}
      activeOpacity={0.85}
    >
      <Avatar
        name={post.author.name}
        size={40}
        verified={false}
        type={post.author.type}
        imageUrl={post.author.avatar}
      />
      <View style={styles.authorInfo}>
        <View style={styles.authorNameRow}>
          <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
          {post.author.verified && (
            <MaterialCommunityIcons name="check-decagram" size={12} color="#7B8B8B" />
          )}
        </View>
        <Text style={styles.authorType}>
          {authorLabel}
          {showsProtectorSince && <Text style={styles.authorSince}>: Desde 05/2026</Text>}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followBtn,
          {
            backgroundColor: followingAuthor ? colors.primary + '12' : colors.primary,
            borderColor: colors.primary + '24',
          },
        ]}
        onPress={(event) => {
          event.stopPropagation();
          onToggleFollowing();
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.82}
      >
        <Text style={[styles.followBtnText, { color: followingAuthor ? colors.primary : '#FFFFFF' }]}>
          {followingAuthor ? 'Seguindo' : 'Seguir'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 13,
    elevation: 2,
  },
  authorInfo: { flex: 1, gap: 2 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  authorName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  authorType: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  authorSince: { fontFamily: 'Montserrat_400Regular', color: '#7C867C' },
  followBtn: {
    minWidth: 58,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  followBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
});
