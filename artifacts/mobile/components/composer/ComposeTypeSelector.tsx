import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { PostType } from '@/constants/data';
import { ComposerSection, sectionStyles } from './ComposerSection';
import type { ComposerColors, ComposerPostType } from './types';

function TypePill({
  item,
  isActive,
  onPress,
}: {
  item: ComposerPostType;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function press() {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    });
    onPress();
  }

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        style={[
          styles.typePill,
          {
            backgroundColor: isActive ? item.color : '#F0F2F5',
            borderColor: isActive ? item.color : 'transparent',
            shadowColor: isActive ? item.color : 'transparent',
          },
        ]}
        onPress={press}
        activeOpacity={1}
      >
        <MaterialCommunityIcons name={item.icon} size={13} color={isActive ? '#FFFFFF' : '#6E6E73'} />
        <Text style={[styles.typePillLabel, { color: isActive ? '#FFFFFF' : '#6E6E73' }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

type ComposeTypeSelectorProps = {
  colors: ComposerColors;
  postTypes: ComposerPostType[];
  selectedType: PostType;
  onSelectType: (type: PostType) => void;
};

export function ComposeTypeSelector({ colors, postTypes, selectedType, onSelectType }: ComposeTypeSelectorProps) {
  return (
    <ComposerSection>
      <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>Qual é a situação?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        {postTypes.map((type) => (
          <TypePill
            key={type.type}
            item={type}
            isActive={selectedType === type.type}
            onPress={() => onSelectType(type.type)}
          />
        ))}
      </ScrollView>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  typeRow: { gap: 5, paddingBottom: 2 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  typePillLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

