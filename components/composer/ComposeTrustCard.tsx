import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PROTECTION_BENEFITS = [
  {
    icon: 'shield-check-outline' as const,
    title: 'Publicação mais protegida',
    text: 'Sinais do perfil e do caso ajudam a reduzir contatos suspeitos.',
  },
  {
    icon: 'map-marker-radius-outline' as const,
    title: 'Ajuda perto do resgate',
    text: 'A localização informa quem pode responder com mais agilidade na região.',
  },
  {
    icon: 'account-group-outline' as const,
    title: 'Rede conectada',
    text: 'Usuários e ONGs próximas podem encontrar o chamado e organizar apoio.',
  },
];

export function ComposeTrustCard() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  return (
    <>
      <View style={styles.trustCard}>
        <View style={styles.topGlow} />

        <View style={styles.trustHeader}>
          <View style={styles.trustTitleBlock}>
            <View style={styles.eyebrowRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color="#1F7A53" />
              <Text style={styles.eyebrow}>Proteção ativa</Text>
            </View>

            <Text style={styles.trustTitle}>Sistema de confiança Helpin</Text>
            <Text style={styles.trustSubtitle}>
              Segurança antes, durante e depois da publicação.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clickButton}
            activeOpacity={0.75}
            onPress={() => setIsOverlayVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Ver detalhes da proteção ativa"
          >
            <Text style={styles.clickButtonText}>CLICK</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent
        visible={isOverlayVisible}
        animationType="fade"
        onRequestClose={() => setIsOverlayVisible(false)}
      >
        <View style={styles.overlayRoot}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => setIsOverlayVisible(false)}
            accessibilityLabel="Fechar detalhes de proteção"
          />

          <View style={styles.overlaySheet}>
            <View style={styles.overlayHandle} />

            <View style={styles.overlayHeader}>
              <View style={styles.overlayShield}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color="#1F7A53" />
              </View>
              <View style={styles.overlayHeading}>
                <Text style={styles.overlayEyebrow}>PROTEÇÃO ATIVA</Text>
                <Text style={styles.overlayTitle}>Resgates mais seguros e eficientes</Text>
              </View>
              <TouchableOpacity
                style={styles.overlayClose}
                onPress={() => setIsOverlayVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <MaterialCommunityIcons name="close" size={18} color="#657167" />
              </TouchableOpacity>
            </View>

            <Text style={styles.overlayIntro}>
              Ao publicar um caso, o Helpin ajuda a aproximar o pedido de usuários e ONGs na região,
              com contexto para uma resposta mais rápida e coordenada.
            </Text>

            <View style={styles.benefitList}>
              {PROTECTION_BENEFITS.map((benefit, index) => (
                <View
                  key={benefit.title}
                  style={[styles.benefitRow, index === PROTECTION_BENEFITS.length - 1 && styles.benefitRowLast]}
                >
                  <View style={styles.benefitIcon}>
                    <MaterialCommunityIcons name={benefit.icon} size={18} color="#277A55" />
                  </View>
                  <View style={styles.benefitCopy}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitText}>{benefit.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.overlaySignal}>
              <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#27845A" />
              <Text style={styles.overlaySignalText}>
                Endereço e informações claras aumentam a chance de ajuda próxima.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.overlayButton}
              onPress={() => setIsOverlayVisible(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.overlayButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trustCard: {
    marginHorizontal: 18,
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderWidth: 0,
    borderColor: '#D8E8DD',
    backgroundColor: '#FBFDF9',
    gap: 14,
    overflow: 'hidden',
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.11,
    shadowRadius: 28,
    elevation: 7,
  },

  topGlow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E7F5EA',
    opacity: 0.85,
  },

  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 3,
  },

  trustTitleBlock: {
    flex: 1,
    gap: 2,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },

  eyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#1F7A53',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  trustTitle: {
    fontSize: 13.0,
    fontFamily: 'Montserrat_700Bold',
    color: '#3c3d3c',
    letterSpacing: -0.35,
  },

  trustSubtitle: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#738076',
    lineHeight: 16,
  },

  clickButton: {
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: '#D5E5D9',
    backgroundColor: '#F2F7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clickButtonText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#51735E',
    letterSpacing: 0.55,
  },

  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20,28,22,0.30)',
  },

  overlaySheet: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 9,
    paddingBottom: 18,
    backgroundColor: '#FBFDF9',
    borderWidth: 1,
    borderColor: '#D7E7DB',
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 12,
  },

  overlayHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
    backgroundColor: '#D8E4DB',
  },

  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },

  overlayShield: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E5D6',
    backgroundColor: '#EAF5ED',
  },

  overlayHeading: {
    flex: 1,
    gap: 2,
  },

  overlayEyebrow: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#1F7A53',
    letterSpacing: 0.8,
  },

  overlayTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#1B251D',
    letterSpacing: -0.25,
  },

  overlayClose: {
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5F1',
  },

  overlayIntro: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#66736A',
    lineHeight: 18,
    marginBottom: 14,
  },

  benefitList: {
    borderWidth: 1,
    borderColor: '#E4ECE6',
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },

  benefitRow: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EEE8',
  },

  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF7EF',
  },

  benefitRowLast: {
    borderBottomWidth: 0,
  },

  benefitCopy: {
    flex: 1,
    gap: 3,
  },

  benefitTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#233027',
  },

  benefitText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#738076',
    lineHeight: 15,
  },

  overlaySignal: {
    marginTop: 13,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EEF7F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  overlaySignalText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#4C6252',
    lineHeight: 15,
  },

  overlayButton: {
    height: 44,
    marginTop: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D6A4F',
  },

  overlayButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
});
