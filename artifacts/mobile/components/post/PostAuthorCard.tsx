import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { Post } from '@/constants/data';
import { PostPhotoGallery } from './PostPhotoGallery';
import { PostPublicationCard } from './PostPublicationCard';

const ZOOHELP_HEADER_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

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
  imageUris,
  isResolved,
  breedAgeParts,
  locationDisplay,
  timeDisplay,
  contactDisplay,
  onPressAuthor,
  onToggleFollowing,
  onPressTrust,
  onSelectImage,
  onPressMessage,
  onPressContact,
}: {
  post: Post;
  colors: Colors;
  followingAuthor: boolean;
  imageUris: string[];
  isResolved: boolean;
  breedAgeParts: string[];
  locationDisplay: string;
  timeDisplay: string;
  contactDisplay?: string;
  onPressAuthor: () => void;
  onToggleFollowing: () => void;
  onPressTrust: () => void;
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
    <View
      style={[
        styles.authorCard,
        {
          backgroundColor: '#FBFDF9',
          borderColor: colors.primary + '14',
        },
      ]}
    >
      <View style={styles.brandSection}>
        <View style={styles.brandRow}>
          <Image source={{ uri: ZOOHELP_HEADER_LOGO }} style={styles.brandLogo} contentFit="contain" />
          <Text style={styles.brandText}>ZooHelp</Text>
        </View>
      </View>

      <View style={styles.authorMainRow}>
        <TouchableOpacity style={styles.authorIdentity} onPress={onPressAuthor} activeOpacity={0.85}>
          <Avatar
            name={post.author.name}
            size={44}
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
        </TouchableOpacity>
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
      </View>

      <PostPhotoGallery
        post={post}
        imageUris={imageUris}
        isResolved={isResolved}
        borderColor={colors.border}
        onSelectImage={onSelectImage}
      />

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

      <TouchableOpacity style={styles.trustBanner} onPress={onPressTrust} activeOpacity={0.84}>
        <View pointerEvents="none" style={styles.trustGlow} />
        <View style={styles.trustCopy}>
          <View style={styles.trustEyebrowRow}>
            <MaterialCommunityIcons name="shield-check-outline" size={12} color="#1F7A53" />
            <Text style={styles.trustEyebrow}>PROTECAO ATIVA</Text>
          </View>
          <Text style={styles.trustTitle}>Sistema de confianca ZooHelp</Text>
          <Text style={styles.trustSubtitle}>Seguranca antes, durante e depois da publicacao.</Text>
        </View>
        <View style={styles.trustClick}>
          <Text style={styles.trustClickText}>CLICK</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  authorCard: {
    gap: 11,
    padding: 12,
    paddingTop: 34,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 11,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    marginBottom: 8,
  },
  brandLogo: {
    width: 28.5,
    height: 28.5,
    borderRadius: 8,
  },
  brandText: {
    top: 2,
    fontSize: 22.5,
    lineHeight: 28,
    fontFamily: 'Montserrat_700Bold',
    color: '#5F6B63',
    letterSpacing: -1,
  },
  brandDivider: {
    width: '75%',
    height: 0.6,
    marginTop: 12,
    marginBottom: -2,
  },
  authorMainRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14,
    backgroundColor: '#38a78213',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#1F3528',
    shadowOffset: { width: 10, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1,
   },
  authorIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  authorInfo: { flex: 1, gap: 3 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  authorName: { fontSize: 13.5, fontFamily: 'Montserrat_700Bold', letterSpacing: -0.2 },
  authorType: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  authorSince: { fontFamily: 'Montserrat_400Regular', color: '#7C867C' },
  followBtn: {
    minWidth: 68,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  followBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  trustBanner: {
    minHeight: 76,
    borderRadius: 18,
    paddingHorizontal: 22,
    marginHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F7FBF8',
    marginTop: 9,
    marginBottom: 22,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 2,
  },
  trustGlow: {
    position: 'absolute',
    right: -26,
    top: -36,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#EAF7EF',
  },
  trustCopy: { flex: 1, gap: 2 },
  trustEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustEyebrow: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#1F7A53',
    letterSpacing: 0.7,
  },
  trustTitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
    letterSpacing: -0.2,
  },
  trustSubtitle: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#6F7D73',
    lineHeight: 13,
  },
  trustClick: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  trustClickText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#607568',
  },
});
