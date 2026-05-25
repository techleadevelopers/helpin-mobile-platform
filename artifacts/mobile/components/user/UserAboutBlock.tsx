import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type UserAboutBlockProps = {
  bio: string;
  location: string;
  verified: boolean;
  activePostsCount: number;
  resolvedPostsCount: number;
  followers: number;
  formatCompactNumber: (value: number) => string;
};

export function UserAboutBlock({
  bio,
  location,
  verified,
  activePostsCount,
  resolvedPostsCount,
  followers,
  formatCompactNumber,
}: UserAboutBlockProps) {
  return (
    <View style={styles.aboutBlock}>
      <View style={styles.aboutIntro}>
        <View style={styles.aboutIconWrap}>
          <MaterialCommunityIcons name="account-heart-outline" size={18} color="#2D6A4F" />
        </View>
        <View style={styles.aboutIntroText}>
          <Text style={styles.aboutTitle}>Perfil da comunidade</Text>
          <Text style={styles.aboutText}>{bio}</Text>
        </View>
      </View>

      <View style={styles.aboutChips}>
        <View style={styles.aboutChip}>
          <MaterialCommunityIcons name="map-marker-outline" size={13} color="#5F6F63" />
          <Text style={styles.aboutChipText} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.aboutChip}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color="#5F6F63" />
          <Text style={styles.aboutChipText}>{verified ? 'Verificado' : 'Comunidade'}</Text>
        </View>
      </View>

      <View style={styles.aboutMetrics}>
        <View style={styles.aboutMetric}>
          <MaterialCommunityIcons name="paw" size={15} color="#2D6A4F" />
          <Text style={styles.aboutMetricValue}>{activePostsCount}</Text>
          <Text style={styles.aboutMetricLabel}>ativos</Text>
        </View>
        <View style={styles.aboutMetric}>
          <MaterialCommunityIcons name="check-circle-outline" size={15} color="#2D6A4F" />
          <Text style={styles.aboutMetricValue}>{resolvedPostsCount}</Text>
          <Text style={styles.aboutMetricLabel}>resolvidos</Text>
        </View>
        <View style={styles.aboutMetric}>
          <MaterialCommunityIcons name="account-group-outline" size={15} color="#2D6A4F" />
          <Text style={styles.aboutMetricValue}>{formatCompactNumber(followers)}</Text>
          <Text style={styles.aboutMetricLabel}>seguidores</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutBlock: { margin: 14, padding: 14, borderRadius: 18, backgroundColor: '#FBFCFA', borderWidth: 1, borderColor: '#E4EAE5', gap: 12 },
  aboutIntro: { flexDirection: 'row', gap: 11 },
  aboutIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3EC' },
  aboutIntroText: { flex: 1, gap: 3 },
  aboutTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  aboutText: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: '#4E5A51', lineHeight: 18 },
  aboutChips: { flexDirection: 'row', gap: 7 },
  aboutChip: { flex: 1, minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3F6F2' },
  aboutChipText: { flex: 1, fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#5F6F63' },
  aboutMetrics: { flexDirection: 'row', gap: 8 },
  aboutMetric: { flex: 1, minHeight: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: '#F6F8F5', borderWidth: 1, borderColor: '#E8EDE8' },
  aboutMetricValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#18231B' },
  aboutMetricLabel: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#7C867C' },
});

