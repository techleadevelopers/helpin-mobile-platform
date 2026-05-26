import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PostContactCard({
  contactDisplay,
  onPress,
}: {
  contactDisplay: string;
  onPress: () => void;
}) {
  if (!contactDisplay) return null;

  return (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.contactIcon}>
        <MaterialCommunityIcons name="whatsapp" size={17} color="#216C55" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactLabel}>WhatsApp do caso</Text>
        <Text style={styles.contactNumber}>{contactDisplay}</Text>
      </View>
      <MaterialCommunityIcons name="open-in-new" size={16} color="#216C55" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contactCard: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 11,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E8E2',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.055,
    shadowRadius: 10,
    elevation: 1,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF6F2',
  },
  contactInfo: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#6A7A73' },
  contactNumber: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#12241D' },
});
