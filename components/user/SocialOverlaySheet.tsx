import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { Author } from '@/constants/data';
import type { SocialOverlayType } from './types';

type SocialOverlaySheetProps = {
  visible: boolean;
  overlay: SocialOverlayType;
  height: number;
  bottomInset: number;
  users: Author[];
  count: number;
  onClose: () => void;
  onOpenProfile: (author: Author) => void;
  getAuthorLabel: (type: Author['type']) => string;
  getSocialLocation: (author: Author) => string;
  formatCompactNumber: (value: number) => string;
};

export function SocialOverlaySheet({
  visible,
  overlay,
  height,
  bottomInset,
  users,
  count,
  onClose,
  onOpenProfile,
  getAuthorLabel,
  getSocialLocation,
  formatCompactNumber,
}: SocialOverlaySheetProps) {
  const title = overlay === 'following' ? 'Seguindo' : 'Seguidores';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.socialOverlayRoot}>
        <TouchableOpacity style={styles.socialBackdrop} activeOpacity={1} onPress={onClose} />
        <BlurView intensity={64} tint="default" style={[styles.socialSheet, { height: height * 0.95, paddingBottom: bottomInset + 14 }]}>
          <View pointerEvents="none" style={styles.socialSheetTint} />
          <View style={styles.socialHandle} />
          <View style={styles.socialHeader}>
            <View>
              <Text style={styles.socialTitle}>{title}</Text>
              <Text style={styles.socialSubtitle}>{formatCompactNumber(count)} conexoes deste perfil</Text>
            </View>
            <TouchableOpacity style={styles.socialCloseButton} onPress={onClose} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={18} color="#5F6861" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.socialList} contentContainerStyle={styles.socialListContent} showsVerticalScrollIndicator={false}>
            {users.map((item) => (
              <TouchableOpacity key={item.id} style={styles.socialRowTap} onPress={() => onOpenProfile(item)} activeOpacity={0.84}>
                <BlurView intensity={48} tint="light" style={styles.socialRow}>
                  <View pointerEvents="none" style={styles.socialRowTint} />
                  <Avatar name={item.name} size={34} verified={item.verified} type={item.type} imageUrl={item.avatar} />
                  <View style={styles.socialInfo}>
                    <Text style={styles.socialName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.socialRole}>{getAuthorLabel(item.type)}</Text>
                  </View>
                  <View style={styles.socialLocation}>
                    <MaterialCommunityIcons name="map-marker-outline" size={12} color="#7C867C" />
                    <Text style={styles.socialLocationText} numberOfLines={1}>{getSocialLocation(item)}</Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  socialOverlayRoot: { flex: 1, justifyContent: 'flex-end' },
  socialBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,22,0.28)' },
  socialSheet: { marginHorizontal: 10, marginBottom: 10, paddingTop: 8, paddingHorizontal: 14, borderRadius: 22, overflow: 'hidden', shadowColor: '#244C35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 22, elevation: 8 },
  socialSheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42, 87, 58, 0.27)' },
  socialHandle: { alignSelf: 'center', width: 34, height: 4, borderRadius: 2, backgroundColor: 'rgba(239,247,241,0.68)', marginBottom: 12 },
  socialHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  socialTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#F3F7F4' },
  socialSubtitle: { marginTop: 2, fontSize: 10, fontFamily: 'Montserrat_500Medium', color: 'rgba(243,247,244,0.78)' },
  socialCloseButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(229,240,231,0.82)' },
  socialList: { flex: 1 },
  socialListContent: { gap: 6, paddingBottom: 8 },
  socialRowTap: { minHeight: 52, borderRadius: 16, overflow: 'hidden' },
  socialRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 9, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  socialRowTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(229,240,231,0.38)' },
  socialInfo: { flex: 1 },
  socialName: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  socialRole: { marginTop: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  socialLocation: { maxWidth: 106, minHeight: 24, paddingHorizontal: 7, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D7E9DA' },
  socialLocationText: { flex: 1, fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },
});

