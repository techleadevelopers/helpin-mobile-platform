import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { PostType } from '@/constants/data';
import type { ComposerColors } from './types';

type ComposeTextCardProps = {
  selectedType: PostType;
  text: string;
  colors: ComposerColors;
  animatedStyle: StyleProp<ViewStyle>;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

function getPlaceholder(selectedType: PostType) {
  if (selectedType === 'post') return 'Compartilhe algo com a comunidade ZooHelp...';
  if (selectedType === 'adoption') return 'Descreva o animal: comportamento, saúde, necessidades...';
  if (selectedType === 'lost') return 'Onde e quando desapareceu? Como é o animal?';
  if (selectedType === 'found') return 'Onde e quando encontrou? Como está o animal?';
  if (selectedType === 'emergency') return 'Descreva a emergência com detalhes urgentes...';
  return 'Descreva a campanha e o impacto que ela terá...';
}

export function ComposeTextCard({
  selectedType,
  text,
  colors,
  animatedStyle,
  onChangeText,
  onFocus,
  onBlur,
}: ComposeTextCardProps) {
  return (
    <Animated.View style={[styles.sectionAnimated, styles.composerCard, animatedStyle]}>
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
      <View style={styles.composerFooter}>
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
          {text.length > 0 ? `${text.length}/1200` : ''}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionAnimated: {
    marginHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  composerCard: { padding: 16, gap: 8 },
  composer: {
    fontSize: 13,
    paddingHorizontal: 5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 25,
    minHeight: 70,
    paddingTop: 0,
  },
  composerFooter: { alignItems: 'flex-end' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});

