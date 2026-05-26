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
      <View style={styles.contactHeader}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="whatsapp" size={18} color="#277A55" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[sectionStyles.label, { color: '#607568' }]}>Contato</Text>
          <Text style={sectionStyles.title}>Resposta rápida</Text>
          <Text style={sectionStyles.support}>Opcional, para facilitar a coordenação da ajuda.</Text>
        </View>
      </View>
      <View style={styles.searchInputContainer}>
        <View style={styles.fieldIcon}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={currentType.color} />
        </View>
        <TextInput
          style={styles.searchInputText}
          placeholder="WhatsApp ou telefone (opcional)"
          placeholderTextColor="#8A928B"
          value={contact}
          onChangeText={onChangeContact}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.privacyNote}>
        <MaterialCommunityIcons name="lock-outline" size={12} color="#748379" />
        <Text style={styles.privacyText}>Compartilhe somente um canal apropriado para contato.</Text>
      </View>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF7EF',
  },
  headerCopy: { flex: 1, gap: 1 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F8F5',
    borderWidth: 1,
    borderColor: '#DFE8E1',
    borderRadius: 16,
    paddingLeft: 7,
    paddingRight: 8,
    minHeight: 46,
  },
  fieldIcon: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4EC',
  },
  searchInputText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#1D2A20',
    padding: 0,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
  },
  privacyText: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#748379',
    lineHeight: 14,
  },
});
