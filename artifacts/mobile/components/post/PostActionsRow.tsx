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
  postActionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, paddingTop: 5 },
  postActionButton: {
    width: 108,
    minHeight: 44,
    borderRadius: 22,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  postActionSolid: {
    flex: 1,
    minHeight: 44,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#626C65',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  postActionText: { fontSize: 12.5, fontFamily: 'Montserrat_700Bold', color: '#F3F7F4', letterSpacing: -0.1 },
});
