import { Image } from 'expo-image';
import React, { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import type { Post } from '@/constants/data';

export function PostPhotoGallery({
  post,
  imageUris,
  isResolved,
  borderColor,
  onSelectImage,
  header,
  children,
}: {
  post: Post;
  imageUris: string[];
  isResolved: boolean;
  borderColor: string;
  onSelectImage: (uri: string) => void;
  header?: ReactNode;
  children?: ReactNode;
}) {
  if (imageUris.length === 0) return null;

  return (
    <View style={styles.photoSection}>
      {header}

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

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    position: 'relative',
    backgroundColor: '#ffffffab',
    marginHorizontal: 10,
    marginTop: 10,
    padding: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    overflow: 'hidden',
  },
  photoBadgesOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
  },
  postPhotoGrid: { flexDirection: 'row', gap: 2 },
  postPhotoGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  postPhotoTile: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#E8ECF0',
  },
  postPhotoSingle: { width: '100%', height: 286 },
  postPhotoHalf: { flex: 1, height: 232 },
  postPhotoFeature: { flex: 1.35, height: 270 },
  postPhotoSideStack: { flex: 1, gap: 2 },
  postPhotoStacked: { height: 134 },
  postPhotoQuarter: { width: '49.7%', height: 164 },
  postPhotoThumb: { width: '100%', height: '100%' },
  postPhotoMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  postPhotoMoreText: { fontSize: 22, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
