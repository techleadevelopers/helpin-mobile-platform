import React from 'react';
import { Animated, TouchableOpacity } from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function PremiumTouchableOpacity({
  onPressIn,
  onPressOut,
  style,
  ...props
}: React.ComponentProps<typeof TouchableOpacity>) {
  const scale = React.useRef(new Animated.Value(1)).current;

  function animateScale(value: number) {
    Animated.spring(scale, {
      toValue: value,
      speed: 36,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }

  return (
    <AnimatedTouchableOpacity
      {...props}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event) => {
        animateScale(0.975);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
    />
  );
}
