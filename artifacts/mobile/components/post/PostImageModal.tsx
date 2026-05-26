import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PostImageModal({
  selectedImageUri,
  authorName,
  authorAvatar,
  onClose,
}: {
  selectedImageUri: string | null;
  authorName: string;
  authorAvatar?: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={Boolean(selectedImageUri)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.imageModal}>
        <TouchableOpacity style={styles.imageModalClose} onPress={onClose} activeOpacity={0.85}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topMeta}>
          <Text style={styles.topMetaText}>ZooHelp</Text>
        </View>
        {selectedImageUri && (
          <Image source={{ uri: selectedImageUri }} style={styles.imageModalPhoto} contentFit="cover" />
        )}
        <View pointerEvents="none" style={styles.gradientTop} />
        <View pointerEvents="none" style={styles.gradientBottom} />
        <View style={styles.sideActions}>
          <SideAction icon="heart" label="1.3k" />
          <SideAction icon="chat-outline" label="237" />
          <SideAction icon="send-outline" label="147" />
          <SideAction icon="bookmark-outline" label="68" />
        </View>
        <View style={styles.bottomInfo}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} contentFit="cover" />
          ) : (
            <View style={styles.authorBubble}>
              <MaterialCommunityIcons name="account-outline" size={16} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.bottomCopy}>
            <Text style={styles.authorText} numberOfLines={1}>{authorName}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SideAction({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.sideAction} activeOpacity={0.8}>
      <MaterialCommunityIcons name={icon} size={25} color="#FFFFFF" />
      <Text style={styles.sideActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  imageModal: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  topMeta: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 4,
    alignItems: 'center',
  },
  topMetaText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  imageModalPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  gradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 230,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  sideActions: {
    position: 'absolute',
    right: 14,
    bottom: 118,
    zIndex: 4,
    alignItems: 'center',
    gap: 16,
  },
  sideAction: {
    alignItems: 'center',
    gap: 3,
  },
  sideActionText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 76,
    bottom: 34,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  authorBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bottomCopy: { flex: 1, gap: 2 },
  authorText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
});
