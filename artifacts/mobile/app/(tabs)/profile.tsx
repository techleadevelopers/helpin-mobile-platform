import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaticMapTiles } from '@/components/StaticMapTiles';
import { MOCK_POSTS } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { shareZooHelpItem } from '@/services/share';
import { getStaticMapUrl } from '@/services/zoohelpApi';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MENU_ITEMS: Array<{ icon: MCIcon; label: string; badge?: string; color: string; route?: string }> = [
  { icon: 'lightning-bolt-outline', label: 'Minha atividade', color: '#2D6A4F', route: '/activity' },
  { icon: 'bell-badge-outline', label: 'Notificacoes', badge: '3', color: '#FF5A7A', route: '/notifications' },
  { icon: 'heart-outline', label: 'Meus favoritos', color: '#E84D6A', route: '/favorites' },
  { icon: 'certificate-outline', label: 'Verificacao de conta', color: '#7357D6', route: '/verification' },
  { icon: 'account-multiple-outline', label: 'Convidar amigos', color: '#1E8A9E' },
  { icon: 'help-circle-outline', label: 'Suporte', color: '#2D6A4F', route: '/support' },
  { icon: 'shield-check-outline', label: 'Privacidade e seguranca', color: '#3D7B7B', route: '/privacy' },
  { icon: 'cog-outline', label: 'Configuracoes', color: '#6B7280', route: '/settings' },
];

const WEEK_DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout, deleteAccount, updateUserAvatar } = useApp();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Sao Paulo, SP');
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState({ lat: -23.5505, lng: -46.6333 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isAlertOverlayVisible, setIsAlertOverlayVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const topPad = Platform.OS === 'web' ? 56 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const displayName = user?.name || '';
  const accountLabel = user?.type === 'ong' ? 'ONG verificada' : user?.type === 'vet' ? 'Veterinario' : 'Protetor animal';
  const myPosts = MOCK_POSTS.slice(0, 3);

  const impactStats = useMemo(
    () => [
      { icon: 'paw' as MCIcon, value: user?.postsCount ?? 12, label: 'Posts' },
      { icon: 'hand-heart' as MCIcon, value: user?.helpedCount ?? 8, label: 'Ajudas' },
      { icon: 'home-heart' as MCIcon, value: user?.adoptionsCount ?? 3, label: 'Adocoes' },
      { icon: 'map-marker-radius' as MCIcon, value: '8 km', label: 'Raio' },
    ],
    [user?.adoptionsCount, user?.helpedCount, user?.postsCount],
  );

  const cardScale = useSharedValue(1);
  const logoutScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));
  const animatedLogoutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;

  function pressCardIn() {
    cardScale.value = withSpring(0.985, { damping: 20, stiffness: 400 });
  }

  function pressCardOut() {
    cardScale.value = withSpring(1, { damping: 20, stiffness: 400 });
  }

  async function detectLocation() {
    if (Platform.OS === 'web') {
      Alert.alert('Localizacao', 'GPS real esta disponivel no app mobile.');
      return;
    }

    setDetectingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissao de localizacao', 'Ative a localizacao para mostrar sua area de impacto.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      setMapCoords({ lat: latitude, lng: longitude });
      setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      const imageUrl = await getStaticMapUrl({
        lat: latitude,
        lng: longitude,
        zoom: 14,
        width: 640,
        height: 320,
      });
      if (imageUrl) setMapImageUrl(imageUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Localizacao', 'Nao foi possivel detectar sua localizacao agora.');
    } finally {
      setDetectingLocation(false);
    }
  }

  async function confirmLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      setIsAlertOverlayVisible(false);
      await logout();
      router.dismissAll();
      router.replace('/login');
    } catch {
      setIsLoggingOut(false);
      Alert.alert('Erro ao sair', 'Nao foi possivel encerrar a sessao. Tente novamente.');
    }
  }

  function handleLogout() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    confirmLogout();
  }

  function handleDeleteAccount() {
    setIsDeleteModalVisible(false);
    Alert.alert('Excluir conta', 'Todos os seus dados serao permanentemente apagados. Esta acao nao pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteAccount() },
    ]);
  }

  function openRescueComposer() {
    setIsAlertOverlayVisible(false);
    router.push('/compose?intent=help&type=emergency&rescue=1');
  }

  async function pickProfilePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      await updateUserAvatar(result.assets[0].uri);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Foto de perfil', 'Nao foi possivel atualizar sua foto agora.');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F7F8F4' }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={[styles.profileTopBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.profileIconBtn} activeOpacity={0.78} onPress={() => router.push('/settings')}>
          <MaterialCommunityIcons name="tune-variant" size={18} color="#2D6A4F" />
        </TouchableOpacity>

        <View style={styles.profileCenterDots}>
          <View style={styles.profileDotActive} />
          <View style={styles.profileDot} />
          <View style={styles.profileDot} />
        </View>

        <TouchableOpacity style={styles.profileIconBtn} activeOpacity={0.78} onPress={() => router.push('/notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={18} color="#2D6A4F" />
          <View style={styles.profileNotifDot} />
        </TouchableOpacity>
      </View>

      <View style={styles.avatarLift}>
        <View style={styles.avatarRing}>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={pickProfilePhoto}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profilePhoto} contentFit="cover" />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={30} color="#FFFFFF" />
              </View>
            )}
            {user.verified && (
              <View style={styles.profileVerifiedBadge}>
                <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.profileCameraBadge}>
              <MaterialCommunityIcons name="camera" size={13} color="#2D6A4F" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.identityBlock}>
        <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.userRole}>{accountLabel}</Text>
        <TouchableOpacity style={styles.locationPill} onPress={detectLocation} activeOpacity={0.82}>
          <MaterialCommunityIcons name="map-marker" size={12} color="#2D6A4F" />
          <Text style={styles.locationText} numberOfLines={1}>
            {detectingLocation ? 'Detectando localizacao...' : locationLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={styles.activityCard}
          activeOpacity={1}
          onPressIn={pressCardIn}
          onPressOut={pressCardOut}
        >
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Impacto</Text>
              <Text style={styles.cardSubtitle}>Ultimos 7 dias</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsAlertOverlayVisible(true)}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Abrir alertas de resgate"
            >
              <LinearGradient colors={['#FF7AB8', '#FF4F8E']} style={styles.goalBubble}>
                <Text style={styles.goalText}>3 alertas</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {impactStats.map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <MaterialCommunityIcons name={stat.icon} size={16} color="#2D6A4F" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, index) => (
              <View key={`${day}-${index}`} style={styles.weekItem}>
                <Text style={[styles.weekText, index === 2 && styles.weekTextActive]}>{day}</Text>
                <View style={[styles.weekDot, index === 2 && styles.weekDotActive]} />
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.routeCard}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>Area de resgate</Text>
          <Text style={styles.routeSubtitle}>Baseado na sua localizacao</Text>
          <TouchableOpacity onPress={detectLocation} activeOpacity={0.78}>
            <Text style={styles.routeLink}>{detectingLocation ? 'Atualizando...' : 'Atualizar GPS ->'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapPreview}>
          <StaticMapTiles latitude={mapCoords.lat} longitude={mapCoords.lng} zoom={13} opacity={0.92} />
          {mapImageUrl ? (
            <Image
              source={{ uri: mapImageUrl }}
              style={styles.realMapImage}
              contentFit="cover"
              onError={() => setMapImageUrl(null)}
            />
          ) : (
            null
          )}
          <View style={styles.mapPulseOuter}>
            <View style={styles.mapPulseInner} />
          </View>
          <View style={styles.mapSmallPin} />
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus casos</Text>
          <TouchableOpacity onPress={() => router.push('/activity')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {myPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.caseRow}
            onPress={() => router.push(`/post/${post.id}`)}
            activeOpacity={0.9}
          >
            <View style={[styles.caseIcon, { backgroundColor: post.urgent ? '#FFE9ED' : '#EAF7EF' }]}>
              <MaterialCommunityIcons
                name={post.urgent ? 'alert-circle' : 'paw'}
                size={16}
                color={post.urgent ? '#f14a4a' : '#106b42'}
              />
            </View>
            <View style={styles.caseInfo}>
              <Text style={styles.caseName} numberOfLines={1}>{post.name}</Text>
              <Text style={styles.caseMeta} numberOfLines={1}>{post.neighborhood} - {post.createdAt}</Text>
            </View>
            <View style={styles.caseStats}>
              <MaterialCommunityIcons name="heart-outline" size={13} color="#8A928B" />
              <Text style={styles.caseStatText}>{post.likes}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
                else if (item.label === 'Convidar amigos') {
                  shareZooHelpItem('ZooHelp', 'Conheca o ZooHelp e ajude animais perto de voce.');
                }
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + '14' }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={16} color="#A4AAA4" />
            </TouchableOpacity>
            {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
        ))}
      </View>

      <Animated.View style={animatedLogoutStyle}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPressIn={() => { logoutScale.value = withSpring(0.98, { damping: 20, stiffness: 400 }); }}
          onPressOut={() => { logoutScale.value = withSpring(1, { damping: 20, stiffness: 400 }); }}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#6B756C" />
          <Text style={styles.logoutText}>{isLoggingOut ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.dangerZone}>
        <TouchableOpacity
          style={styles.dangerHeader}
          onPress={() => setIsDeleteModalVisible(!isDeleteModalVisible)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon-outline" size={14} color="#9A6B6B" />
          <Text style={styles.dangerTitle}>Excluir conta</Text>
          <MaterialCommunityIcons
            name={isDeleteModalVisible ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#9A6B6B"
          />
        </TouchableOpacity>
        {isDeleteModalVisible && (
          <View style={styles.dangerContent}>
            <Text style={styles.dangerDesc}>
              Esta acao e irreversivel. Todos os seus dados serao permanentemente apagados.
            </Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} activeOpacity={0.8}>
              <MaterialCommunityIcons name="delete-forever-outline" size={15} color="#B84D5F" />
              <Text style={styles.deleteBtnText}>Excluir permanentemente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

        <Text style={styles.version}>ZooHelp v1.0</Text>
      </ScrollView>

      {isAlertOverlayVisible && (
        <View style={styles.alertOverlay}>
          <TouchableOpacity
            style={styles.alertScrim}
            activeOpacity={1}
            onPress={() => setIsAlertOverlayVisible(false)}
          />
          <View style={[styles.alertSheet, { paddingBottom: bottomPad + 14 }]}>
            <View style={styles.alertHandle} />
            <View style={styles.alertHeader}>
              <LinearGradient colors={['#FF7A59', '#D94B3D']} style={styles.alertIcon}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.alertHeaderText}>
                <Text style={styles.alertTitle}>Alertas perto de voce</Text>
                <Text style={styles.alertSubtitle}>3 casos precisam de resposta rapida na sua area.</Text>
              </View>
              <TouchableOpacity style={styles.alertCloseBtn} onPress={() => setIsAlertOverlayVisible(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#667066" />
              </TouchableOpacity>
            </View>

            {[
              { title: 'Animal ferido', meta: '0.8 km - urgente', icon: 'medical-bag' as MCIcon },
              { title: 'Pedido de transporte', meta: '1.4 km - voluntario', icon: 'car-emergency' as MCIcon },
              { title: 'ONG solicitou apoio', meta: '2.1 km - doacao/lar temporario', icon: 'shield-heart' as MCIcon },
            ].map((item) => (
              <View key={item.title} style={styles.alertRow}>
                <View style={styles.alertRowIcon}>
                  <MaterialCommunityIcons name={item.icon} size={16} color="#D94B3D" />
                </View>
                <View style={styles.alertRowInfo}>
                  <Text style={styles.alertRowTitle}>{item.title}</Text>
                  <Text style={styles.alertRowMeta}>{item.meta}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.alertPrimaryBtn} onPress={openRescueComposer} activeOpacity={0.88}>
              <MaterialCommunityIcons name="send" size={17} color="#FFFFFF" />
              <Text style={styles.alertPrimaryText}>Pedir ajuda agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertSecondaryBtn}
              onPress={() => {
                setIsAlertOverlayVisible(false);
                router.push('/notifications');
              }}
              activeOpacity={0.82}
            >
              <Text style={styles.alertSecondaryText}>Ver todos os alertas</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 14 },
  profileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  profileIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
  },
  profileCenterDots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CAD8CB' },
  profileDotActive: { width: 16, height: 4, borderRadius: 2, backgroundColor: '#2D6A4F' },
  profileNotifDot: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF4F6E',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarLift: { alignItems: 'center', marginTop: 6 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F7F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  profilePhoto: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#2D6A4F',
  },
  profilePhotoPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: 4,
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
    borderWidth: 2,
    borderColor: '#F7F8F4',
  },
  profileVerifiedBadge: {
    position: 'absolute',
    left: 1,
    bottom: 5,
    width: 23,
    height: 23,
    borderRadius: 11.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F80ED',
    borderWidth: 2,
    borderColor: '#F7F8F4',
  },
  identityBlock: { alignItems: 'center', gap: 4, paddingHorizontal: 18 },
  userName: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#1C251D',
    letterSpacing: -0.25,
  },
  userRole: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#7B827B' },
  locationPill: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#EAF7EF',
  },
  locationText: { maxWidth: 220, fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F' },
  activityCard: {
    marginHorizontal: 18,
    marginTop: 6,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#9AA49A',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  cardSubtitle: { marginTop: 2, fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#A1A8A1' },
  goalBubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F8E',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  goalText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF', textAlign: 'center' },
  statsGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  statBox: { width: '50%', gap: 2 },
  statValue: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#253026' },
  statLabel: { fontSize: 9, fontFamily: 'Montserrat_400Regular', color: '#909890' },
  weekRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1EC',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekItem: { alignItems: 'center', gap: 6 },
  weekText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#A3AAA3' },
  weekTextActive: { color: '#1C251D' },
  weekDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  weekDotActive: { backgroundColor: '#FF5A8C' },
  routeCard: {
    marginHorizontal: 18,
    minHeight: 96,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#9AA49A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  routeInfo: { width: 138, padding: 15, gap: 3, zIndex: 2 },
  routeTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  routeSubtitle: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: '#9AA19A', lineHeight: 13 },
  routeLink: { marginTop: 7, fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
  mapPreview: { flex: 1, backgroundColor: '#F2F3F0', position: 'relative' },
  realMapImage: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  mapLineOne: { position: 'absolute', top: 17, left: -12, right: 8, height: 2, backgroundColor: '#DADFD8', transform: [{ rotate: '-14deg' }] },
  mapLineTwo: { position: 'absolute', top: 50, left: -18, right: -10, height: 2, backgroundColor: '#DEE3DD', transform: [{ rotate: '18deg' }] },
  mapLineThree: { position: 'absolute', bottom: 20, left: 12, right: -20, height: 2, backgroundColor: '#D7DDD6', transform: [{ rotate: '-8deg' }] },
  mapPulseOuter: {
    position: 'absolute',
    zIndex: 2,
    left: '43%',
    top: '35%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 82, 134, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPulseInner: { width: 17, height: 17, borderRadius: 8.5, backgroundColor: '#FF5A8C', borderWidth: 3, borderColor: '#FFFFFF' },
  mapSmallPin: { position: 'absolute', right: 20, top: 30, width: 10, height: 10, borderRadius: 5, backgroundColor: '#76A7FF', borderWidth: 2, borderColor: '#FFFFFF' },
  sectionBlock: { marginHorizontal: 18, gap: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  seeAllText: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#8B928B' },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  caseIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  caseInfo: { flex: 1, gap: 2 },
  caseName: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  caseMeta: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#8E968E' },
  caseStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  caseStatText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
  menuCard: {
    marginHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingVertical: 12 },
  menuIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#253026' },
  menuBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9, backgroundColor: '#FF5A7A' },
  menuBadgeText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  menuDivider: { height: 1, marginLeft: 60, backgroundColor: '#F0F2EE' },
  logoutBtn: {
    marginHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: '#EEF2EC',
  },
  logoutText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#6B756C' },
  dangerZone: {
    marginHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    padding: 12,
    gap: 8,
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dangerTitle: { flex: 1, fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#9A6B6B' },
  dangerContent: { gap: 10, marginTop: 2 },
  dangerDesc: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#9A6B6B', lineHeight: 16 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3C4CC',
  },
  deleteBtnText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#B84D5F' },
  version: { fontSize: 10, fontFamily: 'Montserrat_500Medium', textAlign: 'center', color: '#A0A8A0', marginTop: 2 },
  alertOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  alertScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 27, 20, 0.34)',
  },
  alertSheet: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#1C251D',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  alertHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCE4DA',
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 12,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderText: { flex: 1, gap: 2 },
  alertTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  alertSubtitle: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#7C867C', lineHeight: 16 },
  alertCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4EF',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F2EE',
  },
  alertRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EC',
  },
  alertRowInfo: { flex: 1, gap: 2 },
  alertRowTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#253026' },
  alertRowMeta: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: '#8E968E' },
  alertPrimaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#2D6A4F',
    shadowColor: '#2D6A4F',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  alertPrimaryText: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  alertSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  alertSecondaryText: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#2D6A4F' },
});
