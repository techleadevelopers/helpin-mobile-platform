import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  return (
    <View style={[styles.dock, { borderTopColor: colors.border, paddingBottom: bottomPad + 6 }]}>
      <TouchableOpacity
        style={[
          styles.publishBtn,
          { backgroundColor: canPost ? currentType.color : colors.muted, shadowColor: canPost ? currentType.color : 'transparent' },
        ]}
        onPress={onPublish}
        disabled={!canPost || submitting}
        activeOpacity={0.88}
      >
        {canPost && <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />}
        <Text style={[styles.publishText, { color: canPost ? '#FFFFFF' : colors.mutedForeground }]}>
          {submitting ? 'Publicando...' : currentType.cta}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  publishText: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.1 },
});

