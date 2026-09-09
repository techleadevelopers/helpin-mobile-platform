import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PostContactSheet({
  visible,
  bottomPad,
  contactDisplay,
  onClose,
  onOpenWhatsApp,
}: {
  visible: boolean;
  bottomPad: number;
  contactDisplay: string;
  onClose: () => void;
  onOpenWhatsApp: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.contactOverlayRoot}>
        <TouchableOpacity style={styles.contactOverlayBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.contactSheet, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.contactSheetHandle} />
          <View style={styles.contactSheetHeader}>
            <View style={styles.contactSheetIcon}>
              <MaterialCommunityIcons name="whatsapp" size={21} color="#2D6A4F" />
            </View>
            <TouchableOpacity style={styles.contactSheetClose} onPress={onClose} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={18} color="#5F6861" />
            </TouchableOpacity>
          </View>
          <Text style={styles.contactSheetTitle}>Contato do caso</Text>
          <Text style={styles.contactSheetText}>
            Fale com gentileza, informe que viu o caso no Helpin e combine os detalhes com seguranca antes de se deslocar.
          </Text>
          <View style={styles.contactPhoneBox}>
            <Text style={styles.contactPhoneLabel}>WhatsApp do caso</Text>
            <Text style={styles.contactPhoneValue}>{contactDisplay || 'Indisponivel'}</Text>
          </View>
          <TouchableOpacity style={styles.contactWhatsAppBtn} onPress={onOpenWhatsApp} activeOpacity={0.86}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.contactWhatsAppText}>Abrir WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contactOverlayRoot: { flex: 1, justifyContent: 'flex-end', },
  contactOverlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,28,22,0.28)',  },
  contactSheet: {
    marginHorizontal: 10,
    marginBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECE7',
  },
  contactSheetHandle: { alignSelf: 'center', width: 34, height: 4, borderRadius: 2, backgroundColor: '#DDE5DF', marginBottom: 14 },
  contactSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, },
  contactSheetIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3EC' },
  contactSheetClose: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6F3' },
  contactSheetTitle: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  contactSheetText: { marginTop: 6, fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#5E6962', lineHeight: 18 },
  contactPhoneBox: { marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: '#F8FAF7', borderWidth: 1, borderColor: '#E8EDE8' },
  contactPhoneLabel: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#7C867C' },
  contactPhoneValue: { marginTop: 2, fontSize: 17, fontFamily: 'Montserrat_700Bold', color: '#102018' },
  contactWhatsAppBtn: { marginTop: 12, height: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D6A4F' },
  contactWhatsAppText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
