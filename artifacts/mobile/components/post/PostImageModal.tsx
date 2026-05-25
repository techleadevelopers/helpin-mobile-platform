import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PostImageModal({
  selectedImageUri,
  onClose,
}: {
  selectedImageUri: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={Boolean(selectedImageUri)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.imageModal}>
        <TouchableOpacity style={styles.imageModalClose} onPress={onClose} activeOpacity={0.85}>
          <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        {selectedImageUri && (
          <Image source={{ uri: selectedImageUri }} style={styles.imageModalPhoto} contentFit="contain" />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 48,
    right: 18,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageModalPhoto: { width: SCREEN_WIDTH, height: '78%' },
});
