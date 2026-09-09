import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

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
        <View style={styles.mediaHeading}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="image-multiple-outline" size={16} color="#263129" />
          </View>
          <View>
            <Text style={[sectionStyles.label, { color: '#263129' }]}>Fotos</Text>
            <Text style={sectionStyles.support}>Mostre detalhes úteis do animal.</Text>
          </View>
        </View>
        <View style={styles.mediaBenefit}>
          <MaterialCommunityIcons name="trending-up" size={12} color="#277A55" />
          <Text style={styles.mediaBenefitText}>Mais visibilidade</Text>
        </View>
      </View>
      
      {/* Miniaturas em formato de bolinha na horizontal */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
        <View style={styles.thumbnailContainer}>
          {images.map((uri, index) => (
            <View key={uri} style={styles.thumbnailWrapper}>
              <View style={styles.thumbnailCircle}>
                <Image source={{ uri }} style={styles.thumbnailImage} contentFit="cover" />
                {index === 0 && (
                  <View style={styles.thumbnailBadge}>
                    <Text style={styles.thumbnailBadgeText}>Capa</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.thumbnailRemove} onPress={() => onRemoveImage(uri)}>
                  <MaterialCommunityIcons name="close" size={10} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {images.length < 4 && (
            <TouchableOpacity
              style={[
                styles.thumbnailAdd,
                { borderColor: currentType.color, backgroundColor: '#F1F2F1' }
              ]}
              onPress={onPickImage}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="camera" size={18} color={currentType.color} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  mediaTitleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: 8,
    marginBottom: 12,
  },
  mediaHeading: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 9, 
    flex: 1 
  },
  headerIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF7EF',
  },
  mediaBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#EEF7F0',
  },
  mediaBenefitText: { 
    fontSize: 8.5, 
    fontFamily: 'Montserrat_700Bold', 
    color: '#277A55' 
  },
  thumbnailScroll: {
    flexGrow: 0,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnailCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E8F0EC',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 1.5,
    borderRadius: 4,
    alignItems: 'center',
  },
  thumbnailBadgeText: {
    fontSize: 6,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#FFFFFF',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailAdd: {
    width: 50,
    height: 50,
    left: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});