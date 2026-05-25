import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ComposerSection, sectionStyles } from './ComposerSection';
import type { AddressResult, AddressSuggestion, ComposerColors, ComposerPostType } from './types';

type ComposeLocationSectionProps = {
  location: string;
  manualNumber: string;
  manualNeighborhood: string;
  manualCity: string;
  manualState: string;
  suggestions: AddressSuggestion[];
  showSuggestions: boolean;
  addressSearching: boolean;
  addressResult: AddressResult | null;
  addressLookupFailed: boolean;
  addressManualFallbackVisible: boolean;
  colors: ComposerColors;
  currentType: ComposerPostType;
  onChangeLocation: (value: string) => void;
  onChangeManualNumber: (value: string) => void;
  onChangeManualNeighborhood: (value: string) => void;
  onChangeManualCity: (value: string) => void;
  onChangeManualState: (value: string) => void;
  onFocusSuggestions: () => void;
  onBlurSuggestions: () => void;
  onSelectSuggestion: (placeId: string, description: string) => void;
};

export function ComposeLocationSection({
  location,
  manualNumber,
  manualNeighborhood,
  manualCity,
  manualState,
  suggestions,
  showSuggestions,
  addressSearching,
  addressResult,
  addressLookupFailed,
  addressManualFallbackVisible,
  colors,
  currentType,
  onChangeLocation,
  onChangeManualNumber,
  onChangeManualNeighborhood,
  onChangeManualCity,
  onChangeManualState,
  onFocusSuggestions,
  onBlurSuggestions,
  onSelectSuggestion,
}: ComposeLocationSectionProps) {
  const showManualFields = (addressLookupFailed || addressManualFallbackVisible) && location.trim().length >= 3;

  return (
    <ComposerSection>
      <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>Localização</Text>

      <View style={{ position: 'relative', zIndex: 1000 }}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentType.color} />
          <TextInput
            style={styles.searchInputText}
            placeholder="Digite rua, número e cidade"
            placeholderTextColor="#8A928B"
            value={location}
            onChangeText={onChangeLocation}
            returnKeyType="search"
            onBlur={onBlurSuggestions}
            onFocus={onFocusSuggestions}
          />
          {showManualFields && (
            <TextInput
              style={styles.manualNumberInput}
              value={manualNumber}
              onChangeText={onChangeManualNumber}
              placeholder="Nº"
              placeholderTextColor="#8A928B"
              keyboardType="numbers-and-punctuation"
            />
          )}
        </View>
        {showManualFields && (
          <View style={styles.manualLocationRow}>
            <TextInput
              style={[styles.manualLocationInput, styles.manualNeighborhoodInput]}
              value={manualNeighborhood}
              onChangeText={onChangeManualNeighborhood}
              placeholder="Bairro"
              placeholderTextColor="#8A928B"
            />
            <TextInput
              style={[styles.manualLocationInput, styles.manualCityInput]}
              value={manualCity}
              onChangeText={onChangeManualCity}
              placeholder="Cidade"
              placeholderTextColor="#8A928B"
            />
            <TextInput
              style={[styles.manualLocationInput, styles.manualStateInput]}
              value={manualState}
              onChangeText={(value) => onChangeManualState(value.toUpperCase())}
              placeholder="UF"
              placeholderTextColor="#8A928B"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsList, { backgroundColor: '#FFFFFF' }]}>
            <ScrollView style={{ maxHeight: 200 }}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => onSelectSuggestion(item.id, item.label)}
                >
                  <MaterialCommunityIcons name="map-marker" size={16} color="#7C867C" />
                  <Text style={[styles.suggestionText, { color: '#1D2A20' }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {addressSearching && (
        <Text style={[styles.addressStatusText, { color: colors.mutedForeground }]}>Buscando endereço...</Text>
      )}

      {addressResult && (
        <View style={[styles.addressResultBox, { backgroundColor: currentType.light }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={15} color={currentType.color} />
          <Text style={[styles.addressResultText, { color: colors.foreground }]} numberOfLines={2}>
            {addressResult.label}
          </Text>
        </View>
      )}
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
  manualLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  manualNumberInput: {
    width: 42,
    height: 26,
    borderWidth: 1,
    borderColor: '#E4EAE5',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 0,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#1D2A20',
    textAlign: 'center',
  },
  manualLocationInput: {
    flex: 1,
    minWidth: 0,
    height: 30,
    borderWidth: 1,
    borderColor: '#E4EAE5',
    borderRadius: 11,
    backgroundColor: '#F4F6F3',
    paddingHorizontal: 9,
    paddingVertical: 0,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#1D2A20',
  },
  manualStateInput: {
    flex: 0,
    width: 42,
    textAlign: 'center',
  },
  manualNeighborhoodInput: {
    flex: 0.46,
  },
  manualCityInput: {
    flex: 0.9,
  },
  addressStatusText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: -4,
    paddingHorizontal: 2,
  },
  addressResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
  },
  addressResultText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  suggestionsList: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    backgroundColor: '#FFFFFF',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8ECF0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});

