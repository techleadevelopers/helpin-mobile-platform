import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import { useColors } from '@/hooks/useColors';
import { shareZooHelpItem } from '@/services/share';

const INVITE_MESSAGE =
  'Conheca o ZooHelp: uma rede para publicar casos, acionar ajuda e conectar pessoas, ONGs e voluntarios em resgates animais.';


export default function InviteScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;

  function handleShare() {
    shareZooHelpItem('ZooHelp', INVITE_MESSAGE);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ZooHelpHeader onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 80 }]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="account-multiple-plus" size={28} color="#277A55" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Fortaleça os resgates perto de você</Text>
          <Text style={[styles.heroDescription, { color: colors.mutedForeground }]}>
            Compartilhe o ZooHelp com quem pode ver, responder e ajudar casos reais na sua região.
          </Text>
        </View>

        {/* Stats/Tags */}
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="earth" size={12} color="#277A55" />
            <Text style={styles.tagText}>Público</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="heart-pulse" size={12} color="#277A55" />
            <Text style={styles.tagText}>Resgate</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="shield-check" size={12} color="#277A55" />
            <Text style={styles.tagText}>Confiança</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPad + 12, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Compartilhar convite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, top: 180, },
  
  // Hero Section
  heroSection: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D0EBD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#101614',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Tags
  tagsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#277A55' },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: { marginBottom: 16 },
  sectionKicker: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#8A94A3',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },

  // Steps
  stepsContainer: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EC',
  },
  stepRowLast: { borderBottomWidth: 0 },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: { flex: 1, gap: 4 },
  stepTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  stepText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  // Security Card
  securityCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 24 },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  securityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadge: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#277A55', textTransform: 'uppercase' },
  securityTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  securityDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  shareButton: {
    backgroundColor: '#277A55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#277A55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
});