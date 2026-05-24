import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

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

// Substitua TYPE_GRADIENTS por versíµes mais suaves:
const TYPE_GRADIENTS: Record<PostType, [string, string]> = {
  adoption: ['#4A9B7A', '#2D6A4F'],   // verde suave
  lost: ['#D4A259', '#B8863E'],       // í¢mbar suave
  found: ['#5B8A9F', '#2C5F8A'],     // azul suave
  emergency: ['#D97863', '#A85645'],
  campaign: ['#7B6B9A', '#5B4B7A'],  // roxo suave
  post: ['#8A9B8A', '#6B7B6B'],      // cinza suave
};

interface StatusBadgeProps {
  type: PostType;
  urgent?: boolean;
  resolved?: boolean;
  size?: 'xs' | 'sm' | 'md';
  hideType?: boolean;
}

export function StatusBadge({ type, urgent, resolved, size = 'md', hideType = false }: StatusBadgeProps) {
  const config = POST_TYPE_CONFIG[type];
  const isSmall = size === 'sm';
  const isExtraSmall = size === 'xs';
  const iconSize = isExtraSmall ? 10 : isSmall ? 11 : 13;
  const gradient = TYPE_GRADIENTS[type];

  return (
    <View style={styles.row}>
      {!hideType && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            {
              shadowColor: config.bgColor,
            },
            isSmall && styles.badgeSm,
            isExtraSmall && styles.badgeXs,
          ]}
        >
          <View style={[styles.iconBubble, isSmall && styles.iconBubbleSm, isExtraSmall && styles.iconBubbleXs]}>
            <MaterialCommunityIcons name={TYPE_ICONS[type]} size={iconSize} color="#FFFFFF" />
          </View>
          <Text style={[styles.label, isSmall && styles.labelSm, isExtraSmall && styles.labelXs]}>
            {config.label}
          </Text>
        </LinearGradient>
      )}
      {resolved ? (
        <LinearGradient
          colors={['#2D6A4F', '#1F513B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            styles.resolvedBadge,
            { shadowColor: '#2D6A4F' },
            isSmall && styles.badgeSm,
            isExtraSmall && styles.badgeXs,
          ]}
        >
          <View style={[styles.iconBubble, styles.resolvedIconBubble, isSmall && styles.iconBubbleSm, isExtraSmall && styles.iconBubbleXs]}>
            <MaterialCommunityIcons name="check-circle" size={iconSize} color="#FFFFFF" />
          </View>
          <Text style={[styles.label, styles.resolvedLabel, isSmall && styles.labelSm, isExtraSmall && styles.labelXs]}>
            RESOLVIDO
          </Text>
        </LinearGradient>
      ) : urgent && (
        <LinearGradient
          colors={['#D94B3D', '#C7332A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.badge,
            styles.urgentBadge,
            { shadowColor: '#D94B3D' },
            isSmall && styles.badgeSm,
            isExtraSmall && styles.badgeXs,
          ]}
        >
          <Text style={[styles.label, styles.urgentLabel, isSmall && styles.labelSm, isExtraSmall && styles.labelXs]}>
            URGENTE
          </Text>
        </LinearGradient>
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
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 0 : 3,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeXs: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  iconBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleSm: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  iconBubbleXs: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  labelSm: {
    fontSize: 10,
  },
  labelXs: {
    fontSize: 9,
  },
  urgentBadge: {
    shadowOpacity: 0.24,
    paddingHorizontal: 10,
  },
  resolvedBadge: {
    shadowOpacity: 0.2,
  },
  urgentLabel: {
    color: '#FFFFFF',
  },
  resolvedLabel: {
    color: '#FFFFFF',
  },
  urgentIconBubble: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  resolvedIconBubble: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
});
