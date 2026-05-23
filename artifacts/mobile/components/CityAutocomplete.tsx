import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { searchBrazilCities, type BrazilCity } from '@/services/brazilCities';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CityAutocompleteProps {
  value: string;
  onChangeText: (value: string) => void;
  onSelectCity: (city: BrazilCity) => void;
  placeholder?: string;
  accentColor?: string;
  icon?: MCIcon;
}

export function CityAutocomplete({
  value,
  onChangeText,
  onSelectCity,
  placeholder = 'Busque uma cidade do Brasil',
  accentColor,
  icon = 'map-marker-outline',
}: CityAutocompleteProps) {
  const colors = useColors();
  const [results, setResults] = useState<BrazilCity[]>([]);
  const [focused, setFocused] = useState(false);
  const activeColor = accentColor ?? colors.primary;

  useEffect(() => {
    const term = value.trim();
    if (!focused || term.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchBrazilCities(term).then(setResults).catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(timeout);
  }, [focused, value]);

  function selectCity(city: BrazilCity) {
    onSelectCity(city);
    setResults([]);
    setFocused(false);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.inputShell, { borderColor: focused ? activeColor : colors.border, backgroundColor: colors.card }]}>
        <MaterialCommunityIcons name={icon} size={16} color={activeColor} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={(next) => {
            onChangeText(next);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              onChangeText('');
              setResults([]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View style={[styles.results, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {results.slice(0, 6).map((city) => (
            <TouchableOpacity
              key={`${city.id}-${city.state}`}
              style={[styles.resultRow, { borderBottomColor: colors.border }]}
              onPress={() => selectCity(city)}
              activeOpacity={0.78}
            >
              <MaterialCommunityIcons name="city-variant-outline" size={16} color={activeColor} />
              <View style={styles.resultTextWrap}>
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>{city.name}</Text>
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>Brasil - {city.state}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
    zIndex: 20,
  },
  inputShell: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  results: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resultMeta: { marginTop: 1, fontSize: 11, fontFamily: 'Inter_400Regular' },
});
