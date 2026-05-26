import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PostContactCard } from './PostContactCard';

const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

export function PostLocationMeta({
  locationDisplay,
  timeDisplay,
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
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={mutedColor} />
        <Text style={[styles.locationText, { color: mutedColor }]}>
          {locationDisplay}
        </Text>
        <View style={styles.feedTimeRow}>
          <Image source={{ uri: FEED_TIME_ICON }} style={styles.feedTimeIcon} contentFit="contain" />
          <Text style={[styles.feedTimeText, { color: mutedColor }]} numberOfLines={1}>
            {timeDisplay}
          </Text>
        </View>
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
    borderRadius: 18,
    padding: 9,
    marginTop: 7,
    marginLeft: -20,
    left: -13,
    marginRight: -4,
  },
  locationRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 3,
  },
  locationText: { flex: 1, flexShrink: 1, fontSize: 10.5, lineHeight: 16, fontFamily: 'Montserrat_600SemiBold' },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeIcon: { width: 13, height: 13, opacity: 0.72 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  messageButton: {
    width: '100%',
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D3E2DB',
    marginTop: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#163C2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  messageText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#216C55' },
});
