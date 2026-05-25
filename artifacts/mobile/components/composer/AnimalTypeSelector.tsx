import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ComposerSection, sectionStyles } from './ComposerSection';
import { ANIMAL_OPTIONS, type ComposerColors, type ComposerPostType } from './types';

type AnimalTypeSelectorProps = {
  animalType: 'dog' | 'cat' | 'other';
  colors: ComposerColors;
  currentType: ComposerPostType;
  onSelectAnimal: (value: 'dog' | 'cat' | 'other') => void;
};

export function AnimalTypeSelector({ animalType, colors, currentType, onSelectAnimal }: AnimalTypeSelectorProps) {
  return (
    <ComposerSection>
      <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>Tipo de animal</Text>
      <View style={styles.animalGrid}>
        {ANIMAL_OPTIONS.map((animal) => {
          const isActive = animalType === animal.value;
          return (
            <TouchableOpacity
              key={animal.value}
              style={[
                styles.animalCard,
                {
                  backgroundColor: isActive ? currentType.light : colors.muted,
                  borderColor: isActive ? currentType.color : 'transparent',
                },
              ]}
              onPress={() => onSelectAnimal(animal.value)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name={animal.icon} size={26} color={isActive ? currentType.color : colors.mutedForeground} />
              <Text style={[styles.animalLabel, { color: isActive ? currentType.color : colors.mutedForeground }]}>
                {animal.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  animalGrid: { flexDirection: 'row', gap: 9, paddingHorizontal: 0 },
  animalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 6,
  },
  animalLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

