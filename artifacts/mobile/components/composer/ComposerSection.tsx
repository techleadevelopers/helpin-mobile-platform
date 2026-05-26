import React, { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type ComposerSectionProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function ComposerSection({ children, style }: ComposerSectionProps) {
  return <View style={[styles.section, { backgroundColor: '#FFFFFF' }, style]}>{children}</View>;
}

export const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#607568',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
    letterSpacing: -0.2,
  },
  support: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#77847A',
    lineHeight: 15,
  },
});

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    borderRadius: 19,
    marginTop: 18,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E4ECE6',
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 1,
  },
});
