import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function ComposerSection({ children }: PropsWithChildren) {
  return <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>{children}</View>;
}

export const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});

