import { Image } from 'expo-image';
import React, { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const [galleryWidth, setGalleryWidth] = useState(1);

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
      <View
        style={[styles.postPhotoViewport, { borderColor }]}
        onLayout={(event) => setGalleryWidth(Math.max(1, Math.round(event.nativeEvent.layout.width)))}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
        >
          {imageUris.map((uri, photoIndex) => (
            <TouchableOpacity
              key={`${uri}-${photoIndex}`}
              style={[styles.postPhotoPage, { width: galleryWidth }]}
              onPress={() => onSelectImage(uri)}
              activeOpacity={0.9}
            >
              <Image source={{ uri }} style={styles.postPhotoThumb} contentFit="cover" transition={220} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
  postPhotoViewport: {
    height: 286,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#E8ECF0',
    borderWidth: 1,
  },
  postPhotoPage: { height: '100%' },
  postPhotoThumb: { width: '100%', height: '100%' },
});
