import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ComposerColors, ComposerPostType } from './types';

type ComposeHeaderProps = {
  topPad: number;
  colors: ComposerColors;
  currentType: ComposerPostType;
  progress: number;
  canPost: boolean;
  submitting: boolean;
  onCancel: () => void;
  onPublish: () => void;
};

export function ComposeHeader({
  topPad,
  colors,
  currentType,
  progress,
  canPost,
  submitting,
  onCancel,
  onPublish,
}: ComposeHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.7}>
        <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nova publicação</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: currentType.color, width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.publishTopBtn, { backgroundColor: canPost ? currentType.color : colors.muted }]}
        onPress={onPublish}
        disabled={!canPost || submitting}
        activeOpacity={0.85}
      >
        <Text style={[styles.publishTopText, { color: canPost ? '#FFFFFF' : colors.mutedForeground }]}>
          {submitting ? '...' : 'Publicar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 4 },
  cancelText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 5 },
  headerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  progressBar: {
    width: 80,
    height: 3,
    backgroundColor: '#E8ECF0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 2 },
  publishTopBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  publishTopText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

