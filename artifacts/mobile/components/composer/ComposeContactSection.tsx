import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ComposerSection, sectionStyles } from './ComposerSection';
import type { ComposerColors, ComposerPostType } from './types';

type ComposeContactSectionProps = {
  contact: string;
  colors: ComposerColors;
  currentType: ComposerPostType;
  onChangeContact: (value: string) => void;
};

export function ComposeContactSection({ contact, colors, currentType, onChangeContact }: ComposeContactSectionProps) {
  return (
    <ComposerSection>
      <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>Contato</Text>
      <View style={styles.searchInputContainer}>
        <MaterialCommunityIcons name="phone-outline" size={16} color={currentType.color} />
        <TextInput
          style={styles.searchInputText}
          placeholder="WhatsApp ou telefone (opcional)"
          placeholderTextColor="#8A928B"
          value={contact}
          onChangeText={onChangeContact}
          keyboardType="phone-pad"
        />
      </View>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F6F3',
    borderWidth: 1,
    borderColor: '#E4EAE5',
    borderRadius: 17,
    paddingLeft: 12,
    paddingRight: 8,
    minHeight: 42,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#1D2A20',
    padding: 0,
  },
});

