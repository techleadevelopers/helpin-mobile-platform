import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { PostType } from '@/constants/data';
import { ComposerSection } from './ComposerSection';
import type { ComposerColors, ComposerPostType } from './types';

type ComposerUser = {
  name: string;
  avatar: string | null;
  verified: boolean;
  type: 'person' | 'ong' | 'vet';
};

type ComposeTypeSelectorProps = {
  user: ComposerUser;
  displayName: string;
  authorRoleLabel: string;
  colors: ComposerColors;
  currentType: ComposerPostType;
  postTypes: ComposerPostType[];
  selectedType: PostType;
  onSelectType: (type: PostType) => void;
};

export function ComposeTypeSelector({
  user,
  displayName,
  authorRoleLabel,
  colors,
  currentType,
  postTypes,
  selectedType,
  onSelectType,
}: ComposeTypeSelectorProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedItem = postTypes.find((type) => type.type === selectedType) ?? currentType;
  const roleLabel = user.type === 'ong' && user.verified ? 'ONG verificada' : authorRoleLabel;

  function selectType(type: PostType) {
    onSelectType(type);
    setPickerVisible(false);
  }

  return (
    <>
      <ComposerSection style={styles.typeCard}>
        <View style={styles.publisherRow}>
          <Avatar
            name={displayName}
            size={40}
            verified={user.verified}
            type={user.type}
            imageUrl={user.avatar}
            bgColor={currentType.color}
          />
          <View style={styles.publisherCopy}>
            <Text style={[styles.publisherName, { color: colors.foreground }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.publisherMeta}>
              <View style={styles.roleBadge}>
                <MaterialCommunityIcons name="check-decagram" size={10} color="#277A55" />
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
              <View style={styles.audienceBadge}>
                <MaterialCommunityIcons name="earth" size={10} color="#718077" />
                <Text style={styles.audienceText}>Publico</Text>
              </View>
            </View>
            <Text style={styles.publisherSupport} numberOfLines={1}>
              Publicação vinculada ao perfil.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.compactSelector, { borderColor: selectedItem.color + '28' }]}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.84}
        >
          <View style={styles.compactCopy}>
            <View style={styles.compactTopLine}>
              <Text style={styles.compactLabelText}>SITUAÇÃO</Text>
              <View style={[styles.typePill, { backgroundColor: selectedItem.light }]}>
                <Text style={[styles.typePillText, { color: selectedItem.color }]}>ativo</Text>
              </View>
            </View>
            <Text style={styles.compactValue}>{selectedItem.label}</Text>
          </View>

          <View style={styles.changeAction}>
            <Text style={styles.changeActionText}>Trocar</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#5D6A61" />
          </View>
        </TouchableOpacity>
      </ComposerSection>

      <Modal transparent visible={pickerVisible} animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>PUBLICAção</Text>
            <Text style={styles.sheetTitle}>Qual e a situação?</Text>
            <Text style={styles.sheetSupport}>Escolha a categoria que melhor organiza o pedido.</Text>

            <View style={styles.optionsList}>
              {postTypes.map((item) => {
                const isActive = selectedType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.optionRow,
                      isActive && { borderColor: item.color, backgroundColor: item.light },
                    ]}
                    onPress={() => selectType(item.type)}
                    activeOpacity={0.84}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: item.light }]}>
                      <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionTitle, { color: isActive ? item.color : '#263129' }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.optionSupport}>Direcionar como {item.label.toLowerCase()}.</Text>
                    </View>
                    {isActive && <MaterialCommunityIcons name="check-circle" size={18} color={item.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  typeCard: { paddingTop: 10 },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  publisherCopy: { flex: 1, gap: 3 },
  publisherName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
    letterSpacing: -0.2,
  },
  publisherMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D5E7D9',
    backgroundColor: '#EDF7EF',
  },
  roleText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#277A55' },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#F1F5F2',
  },
  audienceText: { fontSize: 9, fontFamily: 'Montserrat_600SemiBold', color: '#718077' },
  publisherSupport: {
    fontSize: 9,
    fontFamily: 'Montserrat_500Medium',
    color: '#7B877F',
    lineHeight: 13,
  },
  compactSelector: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },
  compactCopy: { flex: 1, gap: 2 },
  compactTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLabelText: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#6D7B72',
    letterSpacing: 0.75,
  },
  typePill: {
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
  },
  compactValue: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#1D2A20',
    letterSpacing: 0,
  },
  changeAction: {
    height: 32,
    borderRadius: 16,
    paddingLeft: 11,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F2F6F3',
    borderWidth: 1,
    borderColor: '#E1EAE4',
  },
  changeActionText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#5D6A61',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,28,22,0.26)',
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDE5DF',
    marginBottom: 6,
  },
  sheetEyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#607568',
    letterSpacing: 0.7,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
  },
  sheetSupport: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#77847A',
    marginBottom: 4,
  },
  optionsList: { gap: 8 },
  optionRow: {
    minHeight: 58,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E6ECE8',
    backgroundColor: '#F8FAF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#263129',
  },
  optionSupport: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#77847A',
  },
});
