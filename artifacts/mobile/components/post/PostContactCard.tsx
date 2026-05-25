import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Colors = {
  card: string;
  border: string;
  primary: string;
  mutedForeground: string;
  foreground: string;
};

export function PostContactCard({
  colors,
  contactDisplay,
  onPress,
}: {
  colors: Colors;
  contactDisplay: string;
  onPress: () => void;
}) {
  if (!contactDisplay) return null;

  return (
    <TouchableOpacity
      style={[
        styles.contactCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.contactIcon, { backgroundColor: colors.primary + '12' }]}>
        <MaterialCommunityIcons name="whatsapp" size={17} color={colors.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>WhatsApp do caso</Text>
        <Text style={[styles.contactNumber, { color: colors.foreground }]}>{contactDisplay}</Text>
      </View>
      <MaterialCommunityIcons name="open-in-new" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  contactIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 10, fontFamily: 'Montserrat_500Medium' },
  contactNumber: { fontSize: 13, fontFamily: 'Montserrat_700Bold' },
});
