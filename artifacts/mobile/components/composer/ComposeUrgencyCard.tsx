import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ComposerColors } from './types';

type ComposeUrgencyCardProps = {
  urgent: boolean;
  colors: ComposerColors;
  animatedStyle: StyleProp<ViewStyle>;
  onToggleUrgent: () => void;
};

export function ComposeUrgencyCard({ urgent, colors, animatedStyle, onToggleUrgent }: ComposeUrgencyCardProps) {
  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.urgentCard,
          {
            backgroundColor: urgent ? '#C95A5A08' : '#FFFFFF',
            borderColor: urgent ? '#C95A5A' : colors.border,
          },
        ]}
        onPress={onToggleUrgent}
        activeOpacity={0.92}
      >
        <View style={[styles.urgentIcon, { backgroundColor: urgent ? '#C95A5A' : colors.muted }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={urgent ? '#FFFFFF' : colors.mutedForeground} />
        </View>
        <View style={styles.urgentInfo}>
          <Text style={[styles.urgentTitle, { color: urgent ? '#C95A5A' : colors.foreground }]}>
            Marcar como URGENTE
          </Text>
          <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
            Aparece em destaque no feed e notifica usuários próximos
          </Text>
        </View>
        <View style={[styles.toggleTrack, { backgroundColor: urgent ? '#C95A5A' : colors.muted }]}>
          <View style={[styles.toggleKnob, { transform: [{ translateX: urgent ? 20 : 2 }] }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  urgentCard: {
    marginHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 20, borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  urgentIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  urgentInfo: { flex: 1, gap: 3 },
  urgentTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  urgentDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  toggleTrack: {
    width: 44, height: 26, borderRadius: 13, justifyContent: 'center',
  },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
});

