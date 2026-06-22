import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { OperationalStatus } from '@/components/OperationalStatus';
import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import { PostMapCard } from '@/components/post/PostMapCard';
import { Post, PostType } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { createZooHelpApi, mapPost } from '@/services/zoohelpApi';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type FilterValue = PostType | 'all' | 'urgent' | 'ong';

const FILTER_OPTIONS: Array<{ label: string; value: FilterValue; icon: MCIcon }> = [
  { label: 'Todos',       value: 'all',       icon: 'paw' },
  { label: 'adoção',      value: 'adoption',  icon: 'home-heart' },
  { label: 'Emergência',  value: 'emergency', icon: 'alert-circle' },
  { label: 'Perdidos',    value: 'lost',      icon: 'magnify' },
  { label: 'Urgente',     value: 'urgent',    icon: 'lightning-bolt' },
];

const DEFAULT_MAP_COORDS = {
  lat: -23.5505,
  lng: -46.6333,
};

function distanceKmBetween(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortByDistance(posts: Post[], center: { lat: number; lng: number }) {
  return [...posts]
    .map((post) => {
      if (post.latitude == null || post.longitude == null) return post;
      return {
        ...post,
        distanceKm: post.distanceKm ?? distanceKmBetween(center, { lat: post.latitude, lng: post.longitude }),
      };
    })
    .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
}

function mergePosts(primary: Post[], secondary: Post[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

function getPostAddress(post: Post) {
  const address = post.locationAddress;
  if (!address) return post.location || post.neighborhood;

  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
  ].filter(Boolean).join(', ');
}

function CaseCard({ item, index }: { item: Post; index: number }) {
  const colors = useColors();
  const router = useRouter();
  const thumbnailUri = item.images?.[0] ?? item.image;
  const addressLabel = getPostAddress(item);

  return (
    <TouchableOpacity
      style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/post/${item.id}`)}
      activeOpacity={0.92}
    >
      <Avatar
        name={item.author.name}
        size={46}
        verified={item.author.verified}
        type={item.author.type}
        imageUrl={item.author.avatar}
      />

      {/* Info */}
      <View style={styles.caseInfo}>
        <View style={styles.caseTopRow}>
          <Text style={[styles.caseAuthorName, { color: colors.foreground }]} numberOfLines={1}>
            {item.author.name}
          </Text>
          {item.author.verified && (
            <MaterialCommunityIcons name="check-decagram" size={13} color="#7B8B8B" />
          )}
          {item.urgent && (
            <View style={styles.urgentPill}>
              <MaterialCommunityIcons name="lightning-bolt" size={9} color="#FFFFFF" />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          )}
        </View>

        <Text style={[styles.caseDescription, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.description}
        </Text>

        <OperationalStatus post={item} variant="compact" />

        <View style={styles.caseLocationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={11} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {addressLabel}
          </Text>
        </View>
      </View>

      {/* Right */}
      <View style={styles.caseRight}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.caseThumb} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.caseThumbFallback, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name="image-outline" size={15} color={colors.mutedForeground} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [apiNearbyPosts, setApiNearbyPosts] = useState<Post[]>([]);
  const [locationLabel, setLocationLabel] = useState('Sao Paulo, SP');
  const [mapCoords, setMapCoords] = useState(DEFAULT_MAP_COORDS);

  useEffect(() => {
    let mounted = true;

    async function loadMapCenter(lat: number, lng: number) {
      setMapCoords({ lat, lng });
    }

    async function loadNearby() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          await loadMapCenter(DEFAULT_MAP_COORDS.lat, DEFAULT_MAP_COORDS.lng);
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (!mounted) return;
        setLocationLabel('Perto de voce');
        await loadMapCenter(position.coords.latitude, position.coords.longitude);
        const api = createZooHelpApi();
        const nearby = await api?.nearby({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radiusKm: 30,
        });
        if (nearby && mounted) {
          setApiNearbyPosts(nearby.map((item) => ({
            ...mapPost(item.post),
            distanceKm: item.distanceKm,
          })));
        }
      } catch {
        await loadMapCenter(DEFAULT_MAP_COORDS.lat, DEFAULT_MAP_COORDS.lng);
      }
    }
    loadNearby();
    return () => {
      mounted = false;
    };
  }, []);

  const feedNearbyPosts = useMemo(() => {
    const withDistances = sortByDistance(posts, mapCoords);
    const close = withDistances.filter((post) => post.distanceKm == null || post.distanceKm <= 30);
    return close.length > 0 ? close : withDistances;
  }, [posts, mapCoords]);

  const nearbyPosts = useMemo(
    () => mergePosts(sortByDistance(apiNearbyPosts, mapCoords), feedNearbyPosts),
    [apiNearbyPosts, feedNearbyPosts, mapCoords]
  );

  const filteredPosts = nearbyPosts.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return p.urgent;
    if (activeFilter === 'ong') return p.author.type === 'ong';
    return p.type === (activeFilter as PostType);
  });

  const urgentCount = nearbyPosts.filter((p) => p.urgent).length;
  const nearbyCount = filteredPosts.length;

  const renderCase = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <CaseCard item={item} index={index} />
    ),
    []
  );

  function openMapRoute() {
    const destination = `${mapCoords.lat},${mapCoords.lng}`;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${destination}&q=Area%20de%20resgate&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Rota indisponivel', 'Nao foi possivel abrir o mapa agora.');
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F5F7F2' }]}>
      {/* â”€â”€ Header â”€â”€ */}
      <ZooHelpHeader />

      <View style={styles.mapIntro}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Próximo a você</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Resgate, adoção e emergências
          </Text>
        </View>
        <View
          style={[
            styles.locationBadge,
            { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' },
          ]}
        >
          <MaterialCommunityIcons name="navigation-variant" size={12} color={colors.primary} />
          <Text style={[styles.locationLabel, { color: colors.primary }]}>{locationLabel}</Text>
        </View>
      </View>

      {/* â”€â”€ Map Placeholder â”€â”€ */}
      <View style={styles.rescueAreaCardWrap}>
        <PostMapCard latitude={mapCoords.lat} longitude={mapCoords.lng} onPress={openMapRoute} />
      </View>

      {/* â”€â”€ Stats quick bar â”€â”€ */}
      <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: 'Casos perto', value: nearbyCount.toString(), color: '#4CAF50', icon: 'paw' },
          { label: 'Emergências', value: urgentCount.toString(), color: '#FF3B30', icon: 'alert-circle' },
          { label: 'ONGs ativas', value: '6', color: '#2F80ED', icon: 'shield-check' },
          { label: 'Clínicas', value: '3', color: '#9B59B6', icon: 'hospital-building' },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />}
            <View style={styles.statItem}>
              <MaterialCommunityIcons name={s.icon as MCIcon} size={13} color={s.color} />
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={renderCase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 110 : insets.bottom + 75 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-search-outline" size={26} color="#7C867C" />
            <Text style={styles.emptyTitle}>Nenhum caso próximo</Text>
            <Text style={styles.emptyText}>Quando o feed tiver casos com localizaçãoo nesta regiÃ£o, eles aparecem aqui.</Text>
          </View>
        }
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_OPTIONS.map((f) => {
              const isActive = activeFilter === f.value;
              const isUrgent = f.value === 'urgent';
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.filterChip,
                    isActive
                      ? {
                          backgroundColor: isUrgent ? '#FF3B30' : colors.primary,
                          borderColor: isUrgent ? '#FF3B30' : colors.primary,
                        }
                      : { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => setActiveFilter(f.value)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={f.icon}
                    size={13}
                    color={isActive ? '#FFFFFF' : colors.mutedForeground}
                  />
                  <Text
                    style={[styles.filterText, { color: isActive ? '#FFFFFF' : colors.mutedForeground }]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  mapIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 2, marginBottom: 8, marginTop: 10, },
  title: { fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  subtitle: { fontSize: 11, fontFamily: 'Montserrat_500Medium', marginTop: 1 },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 17,
    borderWidth: 1,
    maxWidth: 122,
    minHeight: 34,
    flexShrink: 0,
  },
  locationLabel: { flexShrink: 1, fontSize: 10, fontFamily: 'Montserrat_700Bold' },

  rescueAreaCardWrap: {
    marginHorizontal: 14,
    marginBottom: 2,
  },

  mapContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  mapGradient: {
    height: 165,
    position: 'relative',
  },
  mapGradientExpanded: {
    height: 320,
  },
  realMapImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2F80ED',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#2F80ED',
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinPulse: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  mapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  youMarker: {
    position: 'absolute',
    zIndex: 3,
    top: '45%',
    left: '50%',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginLeft: -11,
    marginTop: -11,
  },
  youDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandBtn: {
    position: 'absolute',
    zIndex: 4,
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  expandText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  alertText: { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    shadowColor: '#244C35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statsDivider: { width: 1, marginVertical: 4 },
  statVal: { fontSize: 15, fontFamily: 'Montserrat_700Bold', letterSpacing: -0.3 },
  statLbl: { fontSize: 9, fontFamily: 'Montserrat_500Medium', textAlign: 'center' },

  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
    paddingTop: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#244C35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  filterText: { fontSize: 13, fontFamily: 'Montserrat_700Bold' },

  listContent: { paddingTop: 2, gap: 0 },

  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#244C35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  caseInfo: { flex: 1, gap: 3 },
  caseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  caseAuthorName: { fontSize: 15, fontFamily: 'Montserrat_700Bold', flexShrink: 1, maxWidth: '72%' },
  caseDescription: { fontSize: 11, fontFamily: 'Montserrat_500Medium', lineHeight: 15 },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },
  urgentText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  caseMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },
  distanceChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  distanceText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  caseLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, fontFamily: 'Montserrat_500Medium', flex: 1 },
  caseRight: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  caseThumb: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  caseThumbFallback: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 22,
    borderRadius: 22,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  emptyTitle: { marginTop: 8, fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#172018' },
  emptyText: { marginTop: 4, fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#7C867C', textAlign: 'center', lineHeight: 16 },
});
