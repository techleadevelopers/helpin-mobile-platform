import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PostContactCard } from './PostContactCard';

export function PostLocationMeta({
  locationDisplay,
  contactDisplay,
  mutedColor,
  onPressMessage,
  onPressContact,
}: {
  locationDisplay: string;
  timeDisplay: string;
  contactDisplay?: string;
  mutedColor: string;
  onPressMessage: () => void;
  onPressContact: () => void;
}) {
  return (
    <View style={styles.metaPanel}>
      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={14} color={mutedColor} />
        <Text style={[styles.locationText, { color: mutedColor }]}>
          {locationDisplay}
        </Text>
      </View>
      <TouchableOpacity style={styles.messageButton} onPress={onPressMessage} activeOpacity={0.8}>
        <MaterialCommunityIcons name="message-outline" size={14} color="#216C55" />
        <Text style={styles.messageText}>Mensagem</Text>
      </TouchableOpacity>
      <PostContactCard contactDisplay={contactDisplay ?? ''} onPress={onPressContact} />
    </View>
  );
}

const styles = StyleSheet.create({
  metaPanel: {
    gap: 10,
    paddingTop: 2,
  },
  locationRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    left: -17,
    marginRight: -17,
  },
  locationText: { flex: 1, flexShrink: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Montserrat_600SemiBold' },
  messageButton: {
    width: '100%',
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D3E2DB',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    left: -17,
    shadowColor: '#163C2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  messageText: { fontSize: 12.5, fontFamily: 'Montserrat_700Bold', color: '#216C55' },
});
