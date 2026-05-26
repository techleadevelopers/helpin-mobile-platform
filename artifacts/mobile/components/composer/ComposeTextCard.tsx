import React from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import type { PostType } from '@/constants/data';
import type { ComposerColors, ComposerPostType } from './types';

type ComposeTextCardProps = {
  selectedType: PostType;
  text: string;
  images: string[];
  colors: ComposerColors;
  currentType: ComposerPostType;
  animatedStyle: StyleProp<ViewStyle>;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPickImage: () => void;
  onRemoveImage: (uri: string) => void;
};

function getPlaceholder(selectedType: PostType) {
  if (selectedType === 'post') return 'Escreva algo...';
  if (selectedType === 'adoption') return 'Descreva o animal: comportamento, saúde, necessidades...';
  if (selectedType === 'lost') return 'Onde e quando desapareceu? Como é o animal?';
  if (selectedType === 'found') return 'Onde e quando encontrou? Como está o animal?';
  if (selectedType === 'emergency') return 'Descreva a emergência com detalhes urgentes...';
  return 'Descreva a campanha e o impacto que ela terá...';
}

export function ComposeTextCard({
  selectedType,
  text,
  images,
  colors,
  currentType,
  animatedStyle,
  onChangeText,
  onFocus,
  onBlur,
  onPickImage,
  onRemoveImage,
}: ComposeTextCardProps) {
  return (
    <Animated.View style={[styles.sectionAnimated, styles.composerCard, animatedStyle]}>
      <View style={styles.composerHeader}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="text-box-edit-outline" size={17} color="#263129" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>DETALHES DO CASO</Text>

          <Text style={styles.headerSupport}>Comportamento, saúde e sinais ajudam a orientar o resgate.</Text>
        </View>
      </View>

      <View style={styles.inputSurface}>
        <View style={styles.inputRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.mediaScroll, { width: images.length > 0 ? 108 : 50 }]}
          >
            <View style={styles.mediaRow}>
              {images.map((uri, index) => (
                <View key={uri} style={styles.thumbnailCircle}>
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
              ))}

              {images.length < 4 && (
                <TouchableOpacity
                  style={[styles.thumbnailAdd, { borderColor: currentType.color }]}
                  onPress={onPickImage}
                  activeOpacity={0.82}
                >
                  <MaterialCommunityIcons name="camera" size={16} color="#6A766D" />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <TextInput
            style={[styles.composer, { color: colors.foreground }]}
            placeholder={getPlaceholder(selectedType)}
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={onChangeText}
            multiline
            autoFocus={false}
            textAlignVertical="top"
            maxLength={1200}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </View>
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionAnimated: {
    marginHorizontal: 12,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E1EBE4',
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    backgroundColor: '#FCFDFB',
  },
  composerCard: { padding: 13, gap: 11 },
  composerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7EADB',
    backgroundColor: '#EDF7EF',
  },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
    letterSpacing: 0.72,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
    letterSpacing: -0.2,
  },
  headerSupport: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#78857C',
    lineHeight: 14,
  },
  inputSurface: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5ECE7',
    backgroundColor: '#F5F8F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  composer: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    lineHeight: 19,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 0,
  },
  mediaScroll: { flexGrow: 0, flexShrink: 0 },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E8F0EC',
    backgroundColor: '#FFFFFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 3,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingVertical: 1.5,
    borderRadius: 6,
    alignItems: 'center',
  },
  thumbnailBadgeText: {
    fontSize: 6,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#FFFFFF',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
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
    borderRadius: 25,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFCFA',
  },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerHint: { flex: 1, fontSize: 9.5, fontFamily: 'Montserrat_500Medium', color: '#839087' },
  charCount: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_600SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F0F5F1',
  },
});
