import { usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ZooHelpLoading } from '@/components/ZooHelpLoading';

const TRANSITION_LOADING_MS = 950;

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }

    setVisible(true);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, TRANSITION_LOADING_MS);

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <ZooHelpLoading />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
