import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const DOT_SIZE = 10;
const LOADER_SIZE = 50;
const RADIUS = 25;
const DIAGONAL_RADIUS = 17.5;
const DOT_COLOR = '#333333';

const ORBIT_DOTS = [
  { x: 0, y: -RADIUS, delay: 0 },
  { x: DIAGONAL_RADIUS, y: -DIAGONAL_RADIUS, delay: 70 },
  { x: RADIUS, y: 0, delay: 140 },
  { x: DIAGONAL_RADIUS, y: DIAGONAL_RADIUS, delay: 210 },
  { x: 0, y: RADIUS, delay: 280 },
  { x: -DIAGONAL_RADIUS, y: DIAGONAL_RADIUS, delay: 350 },
  { x: -RADIUS, y: 0, delay: 420 },
  { x: -DIAGONAL_RADIUS, y: -DIAGONAL_RADIUS, delay: 490 },
];

export function ZooHelpLoading() {
  const dots = useRef(ORBIT_DOTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(ORBIT_DOTS[index].delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(dot, {
            toValue: 0,
            duration: 250,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [dots]);

  return (
    <View style={styles.container}>
      <View style={styles.loadingDots}>
        <View style={[styles.dot, styles.centerDot]} />
        {ORBIT_DOTS.map((dot, index) => {
          const scale = dots[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          return (
            <Animated.View
              key={`${dot.x}-${dot.y}`}
              style={[
                styles.dot,
                styles.orbitDot,
                {
                  opacity: dots[index],
                  transform: [
                    { translateX: dot.x },
                    { translateY: dot.y },
                    { scale },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingDots: {
    position: 'relative',
    width: LOADER_SIZE,
    height: LOADER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_COLOR,
  },
  centerDot: {
    opacity: 1,
  },
  orbitDot: {
    opacity: 0,
  },
});
