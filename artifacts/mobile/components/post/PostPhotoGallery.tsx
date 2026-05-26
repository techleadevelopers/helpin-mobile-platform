import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import type { Post } from '@/constants/data';

export function PostPhotoGallery({
  post,
  imageUris,
  isResolved,
  borderColor,
  onSelectImage,
}: {
  post: Post;
  imageUris: string[];
  isResolved: boolean;
  borderColor: string;
  onSelectImage: (uri: string) => void;
}) {
  if (imageUris.length === 0) return null;

  return (
    <View style={styles.photoSection}>
      <View style={styles.photoBadgesOverlay}>
        <StatusBadge
          type={post.type}
          urgent={post.urgent && !isResolved}
          resolved={isResolved}
          size="sm"
          hideType={post.type === 'post'}
        />
      </View>
      {imageUris.length === 1 && (
        <TouchableOpacity
          style={[styles.postPhotoTile, styles.postPhotoSingle, { borderColor }]}
          onPress={() => onSelectImage(imageUris[0])}
          activeOpacity={0.9}
        >
          <Image source={{ uri: imageUris[0] }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
        </TouchableOpacity>
      )}

      {imageUris.length === 2 && (
        <View style={styles.postPhotoGrid}>
          {imageUris.map((uri, photoIndex) => (
            <TouchableOpacity
              key={`${uri}-${photoIndex}`}
              style={[styles.postPhotoTile, styles.postPhotoHalf, { borderColor }]}
              onPress={() => onSelectImage(uri)}
              activeOpacity={0.9}
            >
              <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {imageUris.length === 3 && (
        <View style={styles.postPhotoGrid}>
          <TouchableOpacity
            style={[styles.postPhotoTile, styles.postPhotoFeature, { borderColor }]}
            onPress={() => onSelectImage(imageUris[0])}
            activeOpacity={0.9}
          >
            <Image source={{ uri: imageUris[0] }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
          </TouchableOpacity>
          <View style={styles.postPhotoSideStack}>
            {imageUris.slice(1, 3).map((uri, photoIndex) => (
              <TouchableOpacity
                key={`${uri}-${photoIndex + 1}`}
                style={[styles.postPhotoTile, styles.postPhotoStacked, { borderColor }]}
                onPress={() => onSelectImage(uri)}
                activeOpacity={0.9}
              >
                <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {imageUris.length >= 4 && (
        <View style={styles.postPhotoGridWrap}>
          {imageUris.slice(0, 4).map((uri, photoIndex) => (
            <TouchableOpacity
              key={`${uri}-${photoIndex}`}
              style={[styles.postPhotoTile, styles.postPhotoQuarter, { borderColor }]}
              onPress={() => onSelectImage(uri)}
              activeOpacity={0.9}
            >
              <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
              {photoIndex === 3 && imageUris.length > 4 && (
                <View style={styles.postPhotoMoreOverlay}>
                  <Text style={styles.postPhotoMoreText}>+{imageUris.length - 4}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    marginTop: -1,
    position: 'relative',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FBFDF9',
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 13,
    elevation: 2,
  },
  photoBadgesOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  postPhotoGrid: { flexDirection: 'row', gap: 8 },
  postPhotoGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  postPhotoTile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8ECF0',
  },
  postPhotoSingle: { width: '100%', height: 184 },
  postPhotoHalf: { flex: 1, height: 124 },
  postPhotoFeature: { flex: 1.35, height: 170 },
  postPhotoSideStack: { flex: 1, gap: 8 },
  postPhotoStacked: { height: 81 },
  postPhotoQuarter: { width: '48.8%', height: 112 },
  postPhotoThumb: { width: '100%', height: '100%' },
  postPhotoMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  postPhotoMoreText: { fontSize: 22, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
