import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ComposerColors, ComposerPostType } from './types';

type ComposeDockProps = {
  bottomPad: number;
  colors: ComposerColors;
  currentType: ComposerPostType;
  canPost: boolean;
  submitting: boolean;
  onPublish: () => void;
};

export function ComposeDock({ bottomPad, colors, currentType, canPost, submitting, onPublish }: ComposeDockProps) {
  const disabled = !canPost || submitting;

  return (
    <View style={[styles.dock, { borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}>
      <TouchableOpacity
        style={[
          styles.publishBtn,
          disabled && styles.publishBtnDisabled,
          { shadowColor: canPost ? currentType.color : '#263129' },
        ]}
        onPress={onPublish}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={disabled ? ['#EEF3EF', '#E7EEE8'] : ['#4E5A53', '#303B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.publishGradient}
        >
          <Text style={[styles.publishText, { color: disabled ? '#657168' : '#FFFFFF' }]}>
            {submitting ? 'Publicando...' : currentType.cta}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 9,
    shadowColor: '#14261B',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 10,
  },
  publishBtn: {
    minHeight: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  publishBtnDisabled: {
    shadowOpacity: 0.08,
    elevation: 3,
  },
  publishGradient: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  publishText: {
    textAlign: 'center',
    fontSize: 14.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0,
  },
});
