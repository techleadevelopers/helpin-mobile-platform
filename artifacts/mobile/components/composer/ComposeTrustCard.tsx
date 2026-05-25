import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ZOOHELP_HEADER_LOGO } from './types';

const TRUST_ITEMS = [
  { title: 'Identidade verificada', text: 'Perfil e histórico ajudam a reduzir interações suspeitas.' },
  { title: 'Monitoramento ativo', text: 'Denúncias entram em análise para manter a comunidade segura.' },
  { title: 'Rastreabilidade', text: 'Apoios e contatos preservam contexto para acompanhamento.' },
];

export function ComposeTrustCard() {
  return (
    <View style={[styles.section, styles.trustCard]}>
      <View style={styles.trustHeader}>
        <View style={styles.trustIconBadge}>
          <Image source={{ uri: ZOOHELP_HEADER_LOGO }} style={styles.trustLogo} contentFit="contain" />
        </View>
        <View style={styles.trustTitleBlock}>
          <Text style={styles.trustTitle}>Sistema de confiança ZooHelp</Text>
          <Text style={styles.trustSubtitle}>Camadas de segurança antes e depois da publicação</Text>
        </View>
      </View>

      <View style={styles.trustSignal}>
        <View style={styles.trustSignalDot} />
        <Text style={styles.trustSignalText}>Publicação protegida</Text>
      </View>

      <View style={styles.trustList}>
        {TRUST_ITEMS.map((item) => (
          <View key={item.title} style={styles.trustRow}>
            <View style={styles.trustRowText}>
              <Text style={styles.trustRowTitle}>{item.title}</Text>
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trustCard: {
    marginHorizontal: 12,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    backgroundColor: '#F9FBF8',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#244C35',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  trustIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3EC',
    borderWidth: 1,
    borderColor: '#CFE0D4',
  },
  trustLogo: { width: 31.5, height: 31.5, borderRadius: 8 },
  trustTitleBlock: { flex: 1, gap: 2 },
  trustTitle: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#172018', letterSpacing: -0.2 },
  trustSubtitle: { fontSize: 10.5, fontFamily: 'Montserrat_500Medium', color: '#7C867C', lineHeight: 15 },
  trustSignal: {
    alignSelf: 'flex-start',
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#EAF7EF',
  },
  trustSignalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2D6A4F',
  },
  trustSignalText: { fontSize: 10.5, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  trustList: {
    gap: 0,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EDE8',
  },
  trustRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EE',
  },
  trustRowText: { flex: 1, gap: 2 },
  trustRowTitle: { fontSize: 12.5, fontFamily: 'Montserrat_700Bold', color: '#253026' },
  trustText: { fontSize: 10.5, fontFamily: 'Montserrat_500Medium', color: '#7C867C', lineHeight: 15 },
});

