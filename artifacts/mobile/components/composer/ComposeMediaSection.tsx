import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ComposerSection, sectionStyles } from './ComposerSection';
import type { ComposerColors, ComposerPostType } from './types';

type ComposeMediaSectionProps = {
  images: string[];
  colors: ComposerColors;
  currentType: ComposerPostType;
  onPickImage: () => void;
  onRemoveImage: (uri: string) => void;
};

export function ComposeMediaSection({ images, colors, currentType, onPickImage, onRemoveImage }: ComposeMediaSectionProps) {
  return (
    <ComposerSection>
      <View style={styles.mediaTitleRow}>
        <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>Fotos</Text>
        <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>
          {images.length}/4 · fotos aumentam 3x as chances de ajuda
        </Text>
      </View>
      <View style={styles.mediaGrid}>
        {images.map((uri, index) => (
          <View key={uri} style={styles.mediaThumb}>
            <Image source={{ uri }} style={styles.mediaImg} contentFit="cover" />
            {index === 0 && (
              <View style={styles.mediaMainBadge}>
                <Text style={styles.mediaMainText}>Capa</Text>
              </View>
            )}
            <TouchableOpacity style={styles.mediaRemove} onPress={() => onRemoveImage(uri)}>
              <MaterialCommunityIcons name="close" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 4 && (
          <TouchableOpacity
            style={[styles.mediaAdd, { borderColor: currentType.color, backgroundColor: currentType.light }]}
            onPress={onPickImage}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={22} color={currentType.color} />
            <Text style={[styles.mediaAddText, { color: currentType.color }]}>Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  mediaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mediaHint: { fontSize: 10, fontFamily: 'Inter_400Regular', maxWidth: 180, textAlign: 'right' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaThumb: {
    width: 88, height: 88, borderRadius: 14, overflow: 'hidden', position: 'relative',
  },
  mediaImg: { width: '100%', height: '100%' },
  mediaMainBadge: {
    position: 'absolute', bottom: 5, left: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  mediaMainText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  mediaRemove: {
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaAdd: {
    width: 88, height: 88, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  mediaAddText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});

