import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StaticMapTiles } from '@/components/StaticMapTiles';
import { PremiumTouchableOpacity } from '@/components/post/PremiumTouchableOpacity';

export function PostMapCard({
  latitude,
  longitude,
  onPress,
}: {
  latitude: number;
  longitude: number;
  onPress: () => void;
}) {
  return (
    <PremiumTouchableOpacity style={styles.rescueMapCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.rescueMapInfo}>
        <Text style={styles.rescueMapTitle}>Area de resgate</Text>
        <Text style={styles.rescueMapSubtitle}>Baseado na localização do caso</Text>
        <Text style={styles.rescueMapLink}>{'Abrir rota ->'}</Text>
      </View>
      <View style={styles.rescueMapPreview}>
        <StaticMapTiles latitude={latitude} longitude={longitude} zoom={13} opacity={0.92} />
        <View style={styles.mapPulseOuter}>
          <View style={styles.mapPulseInner} />
        </View>
        <View style={styles.mapSmallPin} />
      </View>
    </PremiumTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rescueMapCard: {
    height: 96,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 22,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
    borderWidth: 0.5,
    borderColor: '#E3EAE5',
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 17,
    elevation: 3,
  },
  rescueMapInfo: { width: 138, padding: 15, gap: 3, zIndex: 2 },
  rescueMapTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  rescueMapSubtitle: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: '#9AA19A', lineHeight: 13 },
  rescueMapLink: { marginTop: 7, fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  rescueMapPreview: { flex: 1, backgroundColor: '#F2F3F0', position: 'relative' },
  mapPulseOuter: {
    position: 'absolute',
    left: '45%',
    top: '44%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,90,140,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPulseInner: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FF5A8C',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  mapSmallPin: {
    position: 'absolute',
    right: 20,
    top: 30,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#76A7FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
