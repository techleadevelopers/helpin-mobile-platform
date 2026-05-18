import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { POST_TYPE_CONFIG, PostType } from '@/constants/data';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TYPE_ICONS: Record<PostType, MCIcon> = {
  adoption:  'home-heart',
  lost:      'magnify',
  found:     'check-circle',
  emergency: 'alert-circle',
  campaign:  'heart-multiple',
  post:      'pencil-outline',
};

interface StatusBadgeProps {
  type: PostType;
  urgent?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ type, urgent, size = 'md' }: StatusBadgeProps) {
  const config = POST_TYPE_CONFIG[type];
  const isSmall = size === 'sm';
  const iconSize = isSmall ? 11 : 13;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: config.bgColor,
            borderColor: config.color + '55',
            shadowColor: config.color,
          },
          isSmall && styles.badgeSm,
        ]}
      >
        <MaterialCommunityIcons name={TYPE_ICONS[type]} size={iconSize} color={config.color} />
        <Text style={[styles.label, { color: config.color }, isSmall && styles.labelSm]}>
          {config.label}
        </Text>
      </View>
      {urgent && (
        <View
          style={[
            styles.badge,
            styles.urgentBadge,
            { shadowColor: '#FF3B30', borderColor: '#FF3B3055' },
            isSmall && styles.badgeSm,
          ]}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={iconSize} color="#FFFFFF" />
          <Text style={[styles.label, styles.urgentLabel, isSmall && styles.labelSm]}>
            URGENTE
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
  },
  urgentBadge: {
    backgroundColor: '#FF3B30',
  },
  urgentLabel: {
    color: '#FFFFFF',
  },
});
