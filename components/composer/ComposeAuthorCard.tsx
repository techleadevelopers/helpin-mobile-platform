import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { ComposerSection } from './ComposerSection';
import type { ComposerColors, ComposerPostType } from './types';

type ComposerUser = {
  name: string;
  avatar: string | null;
  verified: boolean;
  type: 'person' | 'ong' | 'vet';
};

type ComposeAuthorCardProps = {
  user: ComposerUser;
  displayName: string;
  authorRoleLabel: string;
  colors: ComposerColors;
  currentType: ComposerPostType;
};

export function ComposeAuthorCard({ user, displayName, authorRoleLabel, colors, currentType }: ComposeAuthorCardProps) {
  return (
    <ComposerSection>
      <View style={styles.authorRow}>
        <Avatar
          name={displayName}
          size={38}
          verified={user.verified}
          type={user.type}
          imageUrl={user.avatar}
          bgColor={currentType.color}
        />
        <View style={styles.authorInfo}>
          <View style={styles.authorNameRow}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{displayName}</Text>
            {user.verified && <MaterialCommunityIcons name="check-decagram" size={13} color="#7B8B8B" />}
          </View>
          <View style={styles.authorMeta}>
            <View style={[styles.roleBadge, { backgroundColor: currentType.light }]}>
              <Text style={[styles.roleText, { color: currentType.color }]}>{authorRoleLabel}</Text>
            </View>
            <View style={[styles.audienceBadge, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="earth" size={10} color={colors.mutedForeground} />
              <Text style={[styles.audienceText, { color: colors.mutedForeground }]}>Público</Text>
            </View>
          </View>
        </View>
      </View>
    </ComposerSection>
  );
}

const styles = StyleSheet.create({
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorInfo: { flex: 1, gap: 3 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  authorMeta: { flexDirection: 'row', gap: 6 },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  audienceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  audienceText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
