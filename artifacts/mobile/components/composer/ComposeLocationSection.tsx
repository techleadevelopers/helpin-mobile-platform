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
  contact: string;
  onChangeLocation: (value: string) => void;
  onChangeManualNumber: (value: string) => void;
  onChangeManualNeighborhood: (value: string) => void;
  onChangeManualCity: (value: string) => void;
  onChangeManualState: (value: string) => void;
  onChangeContact: (value: string) => void;
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
  contact,
  onChangeLocation,
  onChangeManualNumber,
  onChangeManualNeighborhood,
  onChangeManualCity,
  onChangeManualState,
  onChangeContact,
  onFocusSuggestions,
  onBlurSuggestions,
  onSelectSuggestion,
}: ComposeLocationSectionProps) {
  const hasLocationDraft = location.trim().length >= 3;
  const shouldOfferManualEntry = hasLocationDraft || addressLookupFailed || addressManualFallbackVisible;
  const showManualFields = hasLocationDraft && !addressResult && shouldOfferManualEntry;

  return (
    <ComposerSection>
      <View style={styles.locationHeader}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={17} color="#263129" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={sectionStyles.title}>Onde precisa de ajuda?</Text>
          <Text style={sectionStyles.support}>Aproxima usuários e ONGs disponíveis na região.</Text>
        </View>
      </View>

      <View style={{ position: 'relative', zIndex: 1000 }}>
        <View style={styles.searchInputContainer}>
          <View style={styles.fieldIcon}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentType.color} />
          </View>
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

        {showManualFields && (
          <View style={styles.contactFallbackBlock}>
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
            <View style={styles.locationBenefit}>
              <MaterialCommunityIcons name="lock-outline" size={12} color="#748379" />
              <Text style={styles.locationBenefitText}>Compartilhe somente um canal apropriado para contato.</Text>
            </View>
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
        <View style={styles.addressStatus}>
          <MaterialCommunityIcons name="radar" size={14} color="#277A55" />
          <Text style={[styles.addressStatusText, { color: colors.mutedForeground }]}>Buscando endereço...</Text>
        </View>
      )}

      {addressResult && (
        <View style={[styles.addressResultBox, { backgroundColor: currentType.light }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={15} color={currentType.color} />
          <Text style={[styles.addressResultText, { color: colors.foreground }]} numberOfLines={2}>
            {addressResult.label}
          </Text>
        </View>
      )}

      {!addressResult && !addressSearching && (
        <View style={styles.locationBenefit}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color="#277A55" />
          <Text style={styles.locationBenefitText}>A localização melhora o direcionamento do resgate.</Text>
        </View>
      )}
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
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
  manualLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    width: '100%',
    overflow: 'hidden',
  },
  contactFallbackBlock: {
    gap: 8,
    marginTop: 8,
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
    fontFamily: 'Montserrat_600SemiBold',
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
    fontFamily: 'Montserrat_500Medium',
    color: '#1D2A20',
  },
  manualStateInput: {
    flex: 0,
    width: 68,
    textAlign: 'center',
  },
  manualNeighborhoodInput: {
    flex: 0.46,
  },
  manualCityInput: {
    flex: 0.62,
  },
  addressStatusText: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
  },
  addressStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 3,
  },
  addressResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E9DC',
  },
  addressResultText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 16,
  },
  locationBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  locationBenefitText: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#728077',
    lineHeight: 14,
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
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
  },
});
