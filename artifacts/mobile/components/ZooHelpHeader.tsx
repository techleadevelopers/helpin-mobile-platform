import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const ZOOHELP_HEADER_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

export function ZooHelpHeader() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 8 : Math.max(insets.top, 8);

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: '#F5F7F2', borderBottomColor: '#E4EAE5', paddingTop: topPad },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.78}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.foreground} />
      </TouchableOpacity>
      <View pointerEvents="none" style={styles.logoCenter}>
        <View style={styles.logoRow}>
          <Image source={{ uri: ZOOHELP_HEADER_LOGO }} style={styles.logoIcon} contentFit="contain" />
          <Text style={[styles.logoText, { color: colors.primary }]}>ZooHelp</Text>
        </View>
      </View>
      <View style={styles.headerSideSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSideSpacer: { width: 44, height: 44 },
  logoCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 13,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  logoIcon: {
    width: 31.5,
    height: 31.5,
    borderRadius: 8,
  },
  logoText: {
    marginLeft: 2,
    top: 2,
    fontSize: 25,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: -1,
    lineHeight: 31,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
