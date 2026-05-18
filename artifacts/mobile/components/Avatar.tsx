import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface AvatarProps {
  name: string;
  size?: number;
  verified?: boolean;
  type?: 'person' | 'ong' | 'vet';
  bgColor?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getAvatarColor(name: string): string {
  const palette = [
    '#4CAF50', '#2F80ED', '#9B59B6', '#FF9800',
    '#E91E63', '#00BCD4', '#FF5722', '#607D8B',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, size = 40, verified = false, type, bgColor: bgColorProp }: AvatarProps) {
  const colors = useColors();
  const initials = getInitials(name);
  const bgColor = bgColorProp ?? getAvatarColor(name);
  const fontSize = Math.round(size * 0.38);
  const badgeSize = Math.round(size * 0.38);

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>
          {initials}
        </Text>
      </View>
      {verified && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: '#2F80ED',
              bottom: -1,
              right: -1,
              borderColor: colors.background,
              shadowColor: '#2F80ED',
            },
          ]}
        >
          <MaterialCommunityIcons name="check" size={Math.round(badgeSize * 0.6)} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: 'Inter_700Bold' },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
});
