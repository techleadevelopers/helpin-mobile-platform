import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { MCIcon, ProfileTab } from './types';

const TAB_LABELS: Array<{ key: ProfileTab; label: string; icon: MCIcon }> = [
  { key: 'posts', label: 'Publicacoes', icon: 'grid' },
  { key: 'active', label: 'Ativos', icon: 'alert-circle-outline' },
  { key: 'resolved', label: 'Resolvidos', icon: 'check-circle-outline' },
  { key: 'about', label: 'Sobre', icon: 'information-outline' },
];

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onChangeTab: (tab: ProfileTab) => void;
};

export function ProfileTabs({ activeTab, onChangeTab }: ProfileTabsProps) {
  return (
    <View style={styles.tabs}>
      {TAB_LABELS.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selected && styles.tabButtonActive]}
            onPress={() => onChangeTab(tab.key)}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name={tab.icon} size={17} color={selected ? '#2D6A4F' : '#8A928B'} />
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    padding: 4,
    gap: 4,
    borderRadius: 18,
    backgroundColor: '#F4F7F3',
    borderWidth: 1,
    borderColor: '#E6ECE7',
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8DF',
  },
  tabText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#7E8880', lineHeight: 12 },
  tabTextActive: { color: '#2D6A4F' },
});

