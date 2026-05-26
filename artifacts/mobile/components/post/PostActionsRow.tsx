import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PremiumTouchableOpacity } from '@/components/post/PremiumTouchableOpacity';

export function PostActionsRow({
  onRoute,
  onChat,
  onContact,
}: {
  onRoute: () => void;
  onChat: () => void;
  onContact: () => void;
}) {
  return (
    <View style={styles.postActionsRow}>
      <ActionButton icon="navigation-variant-outline" label="Rota" onPress={onRoute} />
      <ActionButton icon="chat-outline" label="Chat" onPress={onChat} />
      <ActionButton icon="whatsapp" label="Contato" onPress={onContact} />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <PremiumTouchableOpacity style={styles.postActionButton} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.postActionSolid}>
        <MaterialCommunityIcons name={icon} size={16} color="#F3F7F4" />
        <Text style={styles.postActionText}>{label}</Text>
      </View>
    </PremiumTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingTop: 24 },
  postActionButton: {
    flex: 1,
    maxWidth: 118,
    minHeight: 46,
    borderRadius: 23,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.11,
    shadowRadius: 9,
    elevation: 3,
  },
  postActionSolid: {
    flex: 1,
    minHeight: 46,
    overflow: 'hidden',
    borderRadius: 23,
    backgroundColor: '#59645D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  postActionText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#F3F7F4', letterSpacing: -0.1 },
});
