import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

import { ComposerSection, sectionStyles } from './ComposerSection';
import { ANIMAL_OPTIONS, type ComposerColors, type ComposerPostType } from './types';

type AnimalTypeSelectorProps = {
  animalType: 'dog' | 'cat' | 'other';
  colors: ComposerColors;
  currentType: ComposerPostType;
  onSelectAnimal: (value: 'dog' | 'cat' | 'other') => void;
};

export function AnimalTypeSelector({ animalType, colors, currentType, onSelectAnimal }: AnimalTypeSelectorProps) {
  // Função para renderizar o ícone correto baseado no tipo
  const renderAnimalIcon = (animalValue: string, isActive: boolean) => {
    switch (animalValue) {
      case 'dog':
        return (
          <Image 
            source={{ uri: 'https://res.cloudinary.com/limpeja/image/upload/v1779748109/dog1_gx7yx6.png' }}
            style={styles.animalImage}
            resizeMode="contain"
          />
        );
      case 'cat':
        return (
          <Image 
            source={{ uri: 'https://res.cloudinary.com/limpeja/image/upload/v1779748211/cat-Photoroom_aagmqg.png' }}
            style={styles.animalImage}
            resizeMode="contain"
          />
        );
      default:
        // Para 'other', usa a imagem personalizada
        return (
          <Image 
            source={{ uri: 'https://res.cloudinary.com/limpeja/image/upload/v1779748732/image-Photoroom_sxhvun.png' }}
            style={styles.animalImage}
            resizeMode="contain"
          />
        );
    }
  };

  return (
    <ComposerSection>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Image 
            source={{ uri: 'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png' }}
            style={styles.headerIconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[sectionStyles.label, { color: '#263129' }]}>Tipo de animal</Text>
          <Text style={sectionStyles.support}>Identifique para direcionar a busca.</Text>
        </View>
      </View>
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
              {isActive && (
                <View style={styles.selectedBadge}>
                  <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                </View>
              )}
              <View style={[styles.animalIcon, isActive && styles.animalIconActive]}>
                {renderAnimalIcon(animal.value, isActive)}
              </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF7EF',
  },
  headerIconImage: {
    width: 30,
    height: 30,
  },
  headerCopy: { flex: 1, gap: -1 },

  animalGrid: { flexDirection: 'row', gap: 12, marginLeft: '0%', width: '100%',   paddingHorizontal: 8, marginTop: 4, },
  animalCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 67,
    paddingVertical: 18,
    borderRadius: 27,
    borderWidth: 0,
    gap: 4,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#263129',
  },
  animalIcon: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalIconActive: {
    backgroundColor: '#E6F3EA',
  },
  animalLabel: { fontSize: 10.5, fontFamily: 'Montserrat_600SemiBold', paddingTop: 7 },
  animalImage: {
    width: 40,
    height: 40,
  },
});
