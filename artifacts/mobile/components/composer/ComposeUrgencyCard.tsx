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
            backgroundColor: urgent ? '#FFF9F9' : '#FFFFFF',
            borderColor: urgent ? '#E8BFC3' : '#E7EDE8',
          },
        ]}
        onPress={onToggleUrgent}
        activeOpacity={0.92}
      >
        <View style={[styles.cardAccent, { backgroundColor: urgent ? '#C95A5A' : '#DCE9DF' }]} />
        <View style={[styles.urgentIcon, { backgroundColor: urgent ? '#FBE9EB' : '#F4F6F3' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={17} color={urgent ? '#C95A5A' : colors.mutedForeground} />
        </View>
        <View style={styles.urgentInfo}>
          <Text style={[styles.urgentEyebrow, { color: urgent ? '#B84D5F' : '#668071' }]}>
            {urgent ? 'ALERTA ATIVO' : 'PRIORIDADE DO CASO'}
          </Text>
          <Text style={[styles.urgentTitle, { color: urgent ? '#B84D5F' : colors.foreground }]}>
            Marcar como Urgente
          </Text>
          <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
            Destaca o pedido para resposta mais rápida.
          </Text>
        </View>
        <View style={[styles.toggleTrack, { backgroundColor: urgent ? '#C95A5A' : '#DFE6E0' }]}>
          <View style={[styles.toggleKnob, { transform: [{ translateX: urgent ? 16 : 2 }] }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  urgentCard: {
    marginHorizontal: 12,
    minHeight: 66,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, borderWidth: 1,
    shadowColor: '#173022',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 10,
    elevation: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 13,
    bottom: 13,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  urgentIcon: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  urgentInfo: { flex: 1, gap: 2 },
  urgentEyebrow: { fontSize: 8, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.65 },
  urgentTitle: { fontSize: 12.5, fontFamily: 'Montserrat_700Bold' },
  urgentDesc: { fontSize: 10, fontFamily: 'Montserrat_500Medium', lineHeight: 14 },
  toggleTrack: {
    width: 36, height: 22, borderRadius: 11, justifyContent: 'center',
  },
  toggleKnob: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 2, elevation: 1,
  },
});
