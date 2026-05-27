import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ComposeTrustCard } from '@/components/composer';
import type { Post } from '@/constants/data';
import { PostActionsRow } from './PostActionsRow';
import { PostMapCard } from './PostMapCard';
import { PostPhotoGallery } from './PostPhotoGallery';
import { PostPublicationCard } from './PostPublicationCard';

type Colors = {
  primary: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
};

export function PostAuthorCard({
  post,
  colors,
  followingAuthor,
  isOwnPost,
  imageUris,
  isResolved,
  breedAgeParts,
  locationDisplay,
  timeDisplay,
  contactDisplay,
  mapLatitude,
  mapLongitude,
  onPressAuthor,
  onToggleFollowing,
  onPressRoute,
  onSelectImage,
  onPressMessage,
  onPressContact,
}: {
  post: Post;
  colors: Colors;
  followingAuthor: boolean;
  isOwnPost?: boolean;
  imageUris: string[];
  isResolved: boolean;
  breedAgeParts: string[];
  locationDisplay: string;
  timeDisplay: string;
  contactDisplay?: string;
  mapLatitude: number;
  mapLongitude: number;
  onPressAuthor: () => void;
  onToggleFollowing: () => void;
  onPressRoute: () => void;
  onSelectImage: (uri: string) => void;
  onPressMessage: () => void;
  onPressContact: () => void;
}) {
  const isOrg = post.author.type === 'ong' || post.author.type === 'vet';
  const authorLabel =
    post.author.type === 'ong' ? 'ONG' :
    post.author.type === 'vet' ? 'Veterinário' : 'Protetor';
  const showsProtectorSince = !isOrg;

  return (
    <View style={styles.postSurface}>
      <PostPhotoGallery
        post={post}
        imageUris={imageUris}
        isResolved={isResolved}
        borderColor={colors.border}
        onSelectImage={onSelectImage}
        header={
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.authorIdentity} onPress={onPressAuthor} activeOpacity={0.85}>
              <Avatar
                name={post.author.name}
                size={42}
                verified={post.author.verified}
                type={post.author.type}
                imageUrl={post.author.avatar}
              />
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={2}>
                    {post.author.name}
                  </Text>
                </View>
                <Text style={styles.authorType}>
                  {authorLabel}
                  {showsProtectorSince && <Text style={styles.authorSince}>: Desde 05/2026</Text>}
                </Text>
              </View>
            </TouchableOpacity>

            {isOwnPost ? (
              <View style={styles.authorBadge}>
                <MaterialCommunityIcons name="account-check-outline" size={13} color="#2D6A4F" />
                <Text style={styles.authorBadgeText}>Autor</Text>
              </View>
            ) : (
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
            )}
          </View>
        }
      >
        <PostPublicationCard
          description={post.description}
          breedAgeParts={breedAgeParts}
          colors={colors}
          locationDisplay={locationDisplay}
          timeDisplay={timeDisplay}
          contactDisplay={contactDisplay}
          onPressMessage={onPressMessage}
          onPressContact={onPressContact}
        />
      </PostPhotoGallery>

      <View style={styles.embeddedMapHost}>
        <PostMapCard latitude={mapLatitude} longitude={mapLongitude} onPress={onPressRoute} />
      </View>

      <View style={styles.embeddedTrustHost}>
        <ComposeTrustCard />
      </View>

      <View style={styles.embeddedActionsHost}>
        <PostActionsRow onRoute={onPressRoute} onChat={onPressMessage} onContact={onPressContact} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  postSurface: {
    backgroundColor: '#ffffffab',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5ECE7',

    overflow: 'hidden',
  },
  postHeader: {
    minHeight: 64,
    flexDirection: 'row',
    top: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
    backgroundColor: '#22643522',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 24,

  },
  authorIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 2, },
  authorInfo: { flex: 1, gap: 1 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, top: 5, },
  authorName: { flex: 1, fontSize: 12.5, fontFamily: 'Montserrat_700Bold', letterSpacing: 0, color: '#162018' },
  authorType: { fontSize: 10.5, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F', marginTop: 1 },
  authorSince: { fontFamily: 'Montserrat_400Regular', color: '#7C867C', fontSize: 8.5, },
  followBtn: {
    minWidth: 62,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  followBtnText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
  },
  authorBadge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EEF7F0',
    borderWidth: 1,
    borderColor: '#D4E8D9',
  },
  authorBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#2D6A4F',
  },
  embeddedMapHost: {
    marginHorizontal: 10,
    marginTop: 2,
  },
  embeddedTrustHost: {
    marginHorizontal: -6,
    marginTop: -6,
    marginBottom: 0,
  },
  embeddedActionsHost: {
    paddingHorizontal: 14,
    paddingBottom: 38,
    paddingTop: 42,
  },
});
