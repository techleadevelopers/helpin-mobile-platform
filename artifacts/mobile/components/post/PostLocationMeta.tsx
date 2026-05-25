import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

export function PostLocationMeta({
  locationDisplay,
  timeDisplay,
  mutedColor,
}: {
  locationDisplay: string;
  timeDisplay: string;
  mutedColor: string;
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 2 },
  locationText: { flex: 1, flexShrink: 1, fontSize: 12, lineHeight: 16, fontFamily: 'Montserrat_400Regular' },
  feedTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  feedTimeIcon: { width: 13, height: 13, opacity: 0.72 },
  feedTimeText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
});
