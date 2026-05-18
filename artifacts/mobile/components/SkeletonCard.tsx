import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const colors = useColors();

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.muted, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <SkeletonBox width="100%" height={200} borderRadius={12} />
      <View style={styles.body}>
        <View style={styles.header}>
          <SkeletonBox width={32} height={32} borderRadius={16} />
          <View style={styles.headerText}>
            <SkeletonBox width={120} height={12} borderRadius={6} />
            <SkeletonBox width={80} height={10} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonBox width={70} height={22} borderRadius={11} />
        <SkeletonBox width="90%" height={14} borderRadius={7} style={{ marginTop: 6 }} />
        <SkeletonBox width="70%" height={14} borderRadius={7} style={{ marginTop: 4 }} />
        <View style={styles.actions}>
          <SkeletonBox width={80} height={32} borderRadius={16} />
          <SkeletonBox width={80} height={32} borderRadius={16} />
          <SkeletonBox width={80} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  body: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
