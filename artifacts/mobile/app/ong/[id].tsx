import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { AUTHOR_TO_ONG, MOCK_ONGS, MOCK_POSTS } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return String(n);
}

const CAUSE_ICONS: Record<string, MCIcon> = {
  'Adoção responsável e resgate urbano': 'home-heart',
  'Combate a maus-tratos e adoção': 'shield-check',
  'Bem-estar animal público': 'city-variant',
  'Saúde e bem-estar veterinário': 'medical-bag',
  'Resgate em emergências e desastres': 'ambulance',
  'Captação e distribuição de recursos': 'hand-coin',
};

export default function OngProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const ongId = AUTHOR_TO_ONG[id] ?? id;
  const ong = MOCK_ONGS.find((o) => o.id === ongId);
  const ongPosts = MOCK_POSTS.filter((p) => AUTHOR_TO_ONG[p.author.id] === ongId);

  const { followedOngs, toggleFollowOng } = useApp();
  const following = followedOngs.includes(ongId);
  const [donated, setDonated] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const heroScale    = useRef(new Animated.Value(0.92)).current;
  const statsY       = useRef(new Animated.Value(24)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const donateScale  = useRef(new Animated.Value(0.88)).current;
  const donateOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(statsY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
          Animated.timing(statsOpacity, { toValue: 1, duration: 360, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.spring(donateScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.timing(donateOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  function handleFollow() {
    toggleFollowOng(ongId);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function handleDonate() {
    setDonated(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setDonated(false), 2800);
  }

  function handleContact() {
    if (!ong?.contact) return;
    const phone = ong.contact.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/55${phone}`).catch(() =>
      Linking.openURL(`tel:${ong.contact}`)
    );
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!ong) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="domain-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>ONG não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backFallback, { backgroundColor: colors.primary }]}>
          <Text style={styles.backFallbackText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const causeIcon: MCIcon = CAUSE_ICONS[ong.cause] ?? 'paw';

  const COVER_IMAGES = [
    require('@/assets/images/hero_dog.png'),
    require('@/assets/images/hero_cat.png'),
  ];
  const AVATAR_IMAGES = [
    require('@/assets/images/hero_cat.png'),
    require('@/assets/images/hero_dog.png'),
  ];
  const ongIndex = MOCK_ONGS.findIndex((o) => o.id === ongId);
  const coverImg = COVER_IMAGES[ongIndex % COVER_IMAGES.length];
  const avatarImg = AVATAR_IMAGES[ongIndex % AVATAR_IMAGES.length];

  const STATS: Array<{ label: string; value: number; icon: MCIcon; color: string }> = [
    { label: 'Resgatados', value: ong.animalsRescued, icon: 'heart-pulse',       color: '#FF6B6B' },
    { label: 'Adotados',   value: ong.adoptions,      icon: 'home-heart',        color: '#4CAF50' },
    { label: 'Seguidores', value: ong.followers,       icon: 'account-group',    color: '#2F80ED' },
    { label: 'Casos ativos',value: ong.activeCases,   icon: 'clipboard-list',   color: '#FF9800' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── HERO HEADER ── */}
        <Animated.View style={{ opacity: headerOpacity, transform: [{ scale: heroScale }] }}>
          {/* Cover image with gradient overlay */}
          <ImageBackground source={coverImg} style={[styles.cover, { paddingTop: topPad }]} resizeMode="cover">
            <LinearGradient
              colors={['rgba(0,0,0,0.25)', 'rgba(15,52,96,0.82)', 'rgba(15,52,96,0.97)']}
              style={styles.coverGradient}
            >
              {/* Back button */}
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Share button */}
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
                <MaterialCommunityIcons name="share-variant-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Avatar + name */}
              <View style={styles.heroCenter}>
                {/* Animal profile photo */}
                <View style={styles.avatarOuter}>
                  <View style={styles.avatarRing}>
                    <Image source={avatarImg} style={styles.avatarImage} resizeMode="cover" />
                  </View>
                  {ong.verified && (
                    <View style={styles.avatarVerifiedBadge}>
                      <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{ong.name}</Text>
                  {ong.verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: '#2F80ED', shadowColor: '#2F80ED' }]}>
                      <MaterialCommunityIcons name="check-decagram" size={14} color="#FFFFFF" />
                      <Text style={styles.verifiedText}>Verificado</Text>
                    </View>
                  )}
                </View>

                <View style={styles.heroCause}>
                  <View style={[styles.causePill, { backgroundColor: '#4CAF5018', borderColor: '#4CAF5045', shadowColor: '#4CAF50' }]}>
                    <MaterialCommunityIcons name={causeIcon} size={14} color="#4CAF50" />
                    <Text style={[styles.causePillText, { color: '#4CAF50' }]}>{ong.cause}</Text>
                  </View>
                </View>

                <Text style={styles.heroLocation}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.6)" />
                  {'  '}{ong.location}
                </Text>
                <Text style={styles.heroSince}>Desde {ong.since} · CNPJ {ong.cnpj}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* ── STATS GRID ── */}
        <Animated.View
          style={[
            styles.statsGrid,
            { opacity: statsOpacity, transform: [{ translateY: statsY }] },
          ]}
        >
          {STATS.map((s) => (
            <View
              key={s.label}
              style={[
                styles.statBox,
                {
                  backgroundColor: s.color + '0D',
                  borderColor: s.color + '28',
                },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <MaterialCommunityIcons name={s.icon} size={15} color={s.color} />
              </View>
              <View style={styles.statTexts}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {formatNumber(s.value)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── ACTION BUTTONS ── */}
        <Animated.View
          style={[
            styles.actionRow,
            { opacity: donateOpacity, transform: [{ scale: donateScale }] },
          ]}
        >
          {/* DONATE CTA */}
          <TouchableOpacity
            onPress={handleDonate}
            activeOpacity={0.88}
            style={styles.donateBtnWrapper}
          >
            <LinearGradient
              colors={donated ? ['#4CAF50', '#2E7D32'] : ['#FF6B6B', '#E53E3E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.donateBtn,
                {
                  shadowColor: donated ? '#4CAF50' : '#FF6B6B',
                  borderColor: donated ? '#4CAF5050' : '#FF6B6B50',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={donated ? 'check-circle' : 'hand-coin'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.donateBtnText}>
                {donated ? 'Obrigado! ❤️' : 'Doar / Ajudar ONG'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* FOLLOW */}
          <TouchableOpacity
            onPress={handleFollow}
            activeOpacity={0.85}
            style={[
              styles.followBtn,
              {
                backgroundColor: following ? '#4CAF5018' : colors.card,
                borderColor: following ? '#4CAF5050' : colors.border,
                shadowColor: following ? '#4CAF50' : 'transparent',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={following ? 'account-check' : 'account-plus-outline'}
              size={20}
              color={following ? '#4CAF50' : colors.foreground}
            />
            <Text style={[styles.followBtnText, { color: following ? '#4CAF50' : colors.foreground }]}>
              {following ? 'Seguindo' : 'Seguir'}
            </Text>
          </TouchableOpacity>

          {/* WHATSAPP */}
          <TouchableOpacity
            onPress={handleContact}
            activeOpacity={0.85}
            style={[
              styles.iconBtn,
              {
                backgroundColor: '#25D36618',
                borderColor: '#25D36640',
                shadowColor: '#25D366',
              },
            ]}
          >
            <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>
        </Animated.View>

        {/* ── MISSION ── */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconCircle,
                { backgroundColor: '#2F80ED14', borderColor: '#2F80ED35', shadowColor: '#2F80ED' },
              ]}
            >
              <MaterialCommunityIcons name="bullhorn-outline" size={16} color="#2F80ED" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Missão</Text>
          </View>
          <Text style={[styles.missionText, { color: colors.mutedForeground }]}>{ong.mission}</Text>
          <Text style={[styles.descriptionText, { color: colors.foreground }]}>{ong.description}</Text>
        </View>

        {/* ── INFO ── */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIconCircle,
                { backgroundColor: '#4CAF5014', borderColor: '#4CAF5035', shadowColor: '#4CAF50' },
              ]}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color="#4CAF50" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações</Text>
          </View>

          {[
            { icon: 'paw' as MCIcon,            color: '#4CAF50', label: 'Animais',  value: ong.animalTypes.join(', ') },
            { icon: 'phone-outline' as MCIcon,  color: '#2F80ED', label: 'Contato',  value: ong.contact },
            { icon: 'map-marker-outline' as MCIcon, color: '#FF9800', label: 'Local', value: ong.location },
            { icon: 'calendar-outline' as MCIcon, color: '#9B59B6', label: 'Fundação', value: ong.since },
          ].map((row) => (
            <View key={row.label} style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <View
                style={[
                  styles.infoIconCircle,
                  { backgroundColor: row.color + '14', borderColor: row.color + '35', shadowColor: row.color },
                ]}
              >
                <MaterialCommunityIcons name={row.icon} size={15} color={row.color} />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── POSTS BY THIS ONG ── */}
        {ongPosts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconCircle,
                  { backgroundColor: '#FF6B6B14', borderColor: '#FF6B6B35', shadowColor: '#FF6B6B' },
                ]}
              >
                <MaterialCommunityIcons name="clipboard-list-outline" size={16} color="#FF6B6B" />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Casos ativos</Text>
              <View style={[styles.postCountBadge, { backgroundColor: '#FF6B6B', shadowColor: '#FF6B6B' }]}>
                <Text style={styles.postCountText}>{ongPosts.length}</Text>
              </View>
            </View>

            {ongPosts.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.postRow,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/post/${p.id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.postRowLeft}>
                  <StatusBadge type={p.type} size="sm" />
                  <View style={styles.postRowInfo}>
                    <Text style={[styles.postRowName, { color: colors.foreground }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.postRowMeta, { color: colors.mutedForeground }]}>
                      {p.breed} · {p.neighborhood}
                    </Text>
                  </View>
                </View>
                <View style={styles.postRowRight}>
                  {p.urgent && (
                    <View style={[styles.urgentDot, { backgroundColor: '#FF3B30', shadowColor: '#FF3B30' }]}>
                      <MaterialCommunityIcons name="lightning-bolt" size={9} color="#FFFFFF" />
                    </View>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── TRANSPARENCY SEAL ── */}
        <View
          style={[
            styles.trustSeal,
            { backgroundColor: '#2F80ED08', borderColor: '#2F80ED30', shadowColor: '#2F80ED' },
          ]}
        >
          <MaterialCommunityIcons name="shield-check" size={22} color="#2F80ED" />
          <View style={styles.trustText}>
            <Text style={[styles.trustTitle, { color: '#2F80ED' }]}>Organização verificada pela ZooHelp</Text>
            <Text style={[styles.trustSub, { color: colors.mutedForeground }]}>
              Documentação e CNPJ validados · Doações rastreáveis
            </Text>
          </View>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 80 : insets.bottom + 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { fontSize: 16, fontFamily: 'Inter_500Medium', marginTop: 12, marginBottom: 24 },
  backFallback: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  backFallbackText: { color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 15 },

  /* HERO */
  cover: {
    width: '100%',
    minHeight: 260,
  },
  coverGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: 20,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: { alignItems: 'center', marginTop: 16, gap: 8 },
  avatarOuter: {
    width: 92,
    height: 92,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
    shadowColor: '#4CAF50',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#4CAF5070',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  verifiedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  heroCause: { marginTop: 2 },
  causePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  causePillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroLocation: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.65)',
  },
  heroSince: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: -4,
  },

  /* STATS */
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTexts: {
    gap: 1,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', textAlign: 'center' },

  /* ACTIONS */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  donateBtnWrapper: { flex: 1 },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 7,
  },
  donateBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  followBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  /* SECTION */
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1 },
  missionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  descriptionText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },

  /* INFO ROWS */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  /* POST ROWS */
  postCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  postCountText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  postRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  postRowInfo: { flex: 1 },
  postRowName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  postRowMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  postRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  urgentDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },

  /* TRUST SEAL */
  trustSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  trustText: { flex: 1 },
  trustTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  trustSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
