import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

import { OperationalStatus } from '@/components/OperationalStatus';
import { useApp } from '@/context/AppContext';
import { shareZooHelpItem } from '@/services/share';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MENU_ITEMS: Array<{ icon: MCIcon; label: string; color: string; route?: string }> = [
  { icon: 'account-circle-outline', label: 'Meu perfil', color: '#2D6A4F' },
  { icon: 'card-account-details-outline', label: 'Meus dados', color: '#2D6A4F' },
  { icon: 'lightning-bolt-outline', label: 'Minha atividade', color: '#2D6A4F', route: '/activity' },
  { icon: 'bell-badge-outline', label: 'Notificacoes', color: '#FF5A7A', route: '/notifications' },
  { icon: 'heart-outline', label: 'Meus favoritos', color: '#E84D6A', route: '/favorites' },
  { icon: 'certificate-outline', label: 'Verificacao de conta', color: '#7357D6', route: '/verification' },
  { icon: 'account-multiple-outline', label: 'Convidar amigos', color: '#1E8A9E' },
  { icon: 'help-circle-outline', label: 'Suporte', color: '#2D6A4F', route: '/support' },
  { icon: 'shield-check-outline', label: 'Privacidade e seguranca', color: '#3D7B7B', route: '/privacy' },
  { icon: 'cog-outline', label: 'Configuracoes', color: '#6B7280', route: '/settings' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    user,
    posts,
    chatUnreadCount,
    chatMessageNotifications,
    logout,
    deleteAccount,
    updateUserAvatar,
    updateUserProfile,
  } = useApp();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDataOverlayVisible, setIsDataOverlayVisible] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Localizacao nao definida');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileCep, setProfileCep] = useState('');
  const [profileStreet, setProfileStreet] = useState('');
  const [profileNumber, setProfileNumber] = useState('');
  const [profileComplement, setProfileComplement] = useState('');
  const [profileNeighborhood, setProfileNeighborhood] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [addressFieldsVisible, setAddressFieldsVisible] = useState(false);
  const lastCepLookupRef = useRef('');

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const displayName = user?.name || '';
  const accountLabel = user?.type === 'ong' ? 'ONG verificada' : user?.type === 'vet' ? 'Veterinario' : 'Protetor animal';
  const myPosts = user?.id ? posts.filter((post) => post.author.id === user.id).slice(0, 3) : [];
  const unreadNotifications = chatUnreadCount + chatMessageNotifications.filter((item) => !item.isRead).length;
  const menuItems = MENU_ITEMS.filter((item) => item.label !== 'Verificacao de conta' || user?.type === 'ong');

  const logoutScale = useSharedValue(1);

  const animatedLogoutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

  useEffect(() => {
    const address = user?.profileAddress;
    const nextLocation = [address?.neighborhood, address?.city, address?.state?.toUpperCase()]
      .filter(Boolean)
      .join(', ');
    setLocationLabel(nextLocation || 'Localizacao nao definida');
  }, [user?.profileAddress]);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;

  function formatCep(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  function openDataOverlay() {
    if (!user) return;
    const address = user.profileAddress ?? {};
    setProfileName(user.name);
    setProfileCep(formatCep(address.cep ?? ''));
    setProfileStreet(address.street ?? '');
    setProfileNumber(address.number ?? '');
    setProfileComplement(address.complement ?? '');
    setProfileNeighborhood(address.neighborhood ?? '');
    setProfileCity(address.city ?? '');
    setProfileState((address.state ?? '').toUpperCase());
    setAddressFieldsVisible(Boolean(address.cep || address.street || address.city || address.state));
    lastCepLookupRef.current = (address.cep ?? '').replace(/\D/g, '');
    setIsDataOverlayVisible(true);
  }

  async function lookupCep(nextCep = profileCep) {
    const digits = nextCep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    if (lastCepLookupRef.current === digits && profileCity && profileState) {
      setAddressFieldsVisible(true);
      return;
    }

    lastCepLookupRef.current = digits;
    setCepLoading(true);
    setAddressFieldsVisible(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const payload = (await response.json()) as {
        erro?: boolean;
        localidade?: string;
        uf?: string;
        logradouro?: string;
        bairro?: string;
      };
      if (!response.ok || payload.erro) {
        Alert.alert('CEP nao encontrado', 'Confira o CEP e tente novamente.');
        return;
      }
      if (lastCepLookupRef.current !== digits) return;
      setProfileStreet(payload.logradouro ?? '');
      setProfileNeighborhood(payload.bairro ?? '');
      setProfileCity(payload.localidade ?? '');
      setProfileState((payload.uf ?? '').toUpperCase());
    } catch {
      Alert.alert('CEP indisponivel', 'Nao foi possivel consultar o CEP agora. Preencha o endereco manualmente.');
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepChange(value: string) {
    const nextCep = formatCep(value);
    setProfileCep(nextCep);
    const digits = nextCep.replace(/\D/g, '');
    if (digits.length === 8) lookupCep(nextCep);
    else setAddressFieldsVisible(false);
  }

  async function handleSaveProfileData() {
    const cleanName = profileName.trim();
    if (!cleanName) {
      Alert.alert('Nome obrigatorio', 'Informe seu nome para salvar.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateUserProfile({
        name: cleanName,
        cep: profileCep.replace(/\D/g, ''),
        street: profileStreet.trim(),
        number: profileNumber.trim(),
        complement: profileComplement.trim(),
        neighborhood: profileNeighborhood.trim(),
        city: profileCity.trim(),
        state: profileState.trim().toUpperCase(),
      });
      const nextLocation = [profileNeighborhood.trim(), profileCity.trim(), profileState.trim().toUpperCase()]
        .filter(Boolean)
        .join(', ');
      if (nextLocation) setLocationLabel(nextLocation);
      setIsDataOverlayVisible(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Meus dados', 'Nao foi possivel salvar seus dados agora.');
    } finally {
      setSavingProfile(false);
    }
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
      setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
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
      <View style={[styles.profileTopBar, { paddingTop: topPad + 6 }]}>
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
          {unreadNotifications > 0 && <View style={styles.profileNotifDot} />}
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
                <MaterialCommunityIcons name="check-decagram" size={21} color="#7B8B8B" />
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

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus casos</Text>
          <TouchableOpacity onPress={() => router.push('/activity')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {myPosts.length > 0 ? (
          myPosts.map((post) => (
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
                <OperationalStatus post={post} variant="line" />
              </View>
              <View style={styles.caseStats}>
                <MaterialCommunityIcons name="heart-outline" size={13} color="#8A928B" />
                <Text style={styles.caseStatText}>{post.likes}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCases}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#8A928B" />
            <Text style={styles.emptyCasesText}>Nenhum caso publicado ainda.</Text>
          </View>
        )}
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, index) => {
          const isOwnProfileItem = item.label === 'Meu perfil';
          const menuLabel = isOwnProfileItem && user?.type === 'ong' ? 'Perfil da ONG' : item.label;
          const menuIcon = isOwnProfileItem && user?.type === 'ong' ? 'office-building-outline' : item.icon;

          return (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isOwnProfileItem && user?.id) {
                  router.push({ pathname: '/(tabs)/user/[id]', params: { id: user.id } });
                } else if (item.label === 'Meus dados') {
                  openDataOverlay();
                } else if (item.route) router.push(item.route as any);
                else if (item.label === 'Convidar amigos') {
                  shareZooHelpItem('ZooHelp', 'Conheca o ZooHelp e ajude animais perto de voce.');
                }
              }}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + '14' }]}>
                <MaterialCommunityIcons name={menuIcon} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{menuLabel}</Text>
              {item.label === 'Notificacoes' && unreadNotifications > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{Math.min(unreadNotifications, 99)}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={16} color="#A4AAA4" />
            </TouchableOpacity>
            {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
          </React.Fragment>
          );
        })}
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
      </ScrollView>

      <Modal transparent visible={isDataOverlayVisible} animationType="fade" onRequestClose={() => setIsDataOverlayVisible(false)}>
        <View style={styles.dataOverlayRoot}>
          <TouchableOpacity style={styles.dataBackdrop} activeOpacity={1} onPress={() => setIsDataOverlayVisible(false)} />
          <View style={[styles.dataSheet, { paddingBottom: bottomPad + 14 }]}>
            <View style={styles.dataHandle} />
            <View style={styles.dataHeader}>
              <View style={styles.dataHeaderIcon}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#2D6A4F" />
              </View>
              <View style={styles.dataHeaderText}>
                <Text style={styles.dataTitle}>Meus dados</Text>
                <Text style={styles.dataSubtitle}>Atualize nome e endereco principal</Text>
              </View>
              <TouchableOpacity style={styles.dataCloseBtn} onPress={() => setIsDataOverlayVisible(false)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={18} color="#667066" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.textField}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Seu nome"
                placeholderTextColor="#8A928B"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>CEP</Text>
              <TextInput
                style={styles.textField}
                value={profileCep}
                onChangeText={handleCepChange}
                onBlur={() => lookupCep()}
                placeholder="00000-000"
                placeholderTextColor="#8A928B"
                keyboardType="number-pad"
                maxLength={9}
              />
              {cepLoading && <Text style={styles.cepLoadingText}>Consultando CEP...</Text>}
            </View>

            {addressFieldsVisible && (
              <View style={styles.addressFields}>
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Rua</Text>
                  <TextInput
                    style={styles.textField}
                    value={profileStreet}
                    onChangeText={setProfileStreet}
                    placeholder="Rua"
                    placeholderTextColor="#8A928B"
                  />
                </View>

                <View style={styles.microRow}>
                  <View style={[styles.formGroup, styles.numberField]}>
                    <Text style={styles.fieldLabel}>Numero</Text>
                    <TextInput
                      style={styles.textField}
                      value={profileNumber}
                      onChangeText={setProfileNumber}
                      placeholder="N"
                      placeholderTextColor="#8A928B"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.complementField]}>
                    <Text style={styles.fieldLabel}>Complemento</Text>
                    <TextInput
                      style={styles.textField}
                      value={profileComplement}
                      onChangeText={setProfileComplement}
                      placeholder="Apto, bloco"
                      placeholderTextColor="#8A928B"
                    />
                  </View>
                </View>

                <View style={styles.microRow}>
                  <View style={[styles.formGroup, styles.neighborhoodField]}>
                    <Text style={styles.fieldLabel}>Bairro</Text>
                    <TextInput
                      style={styles.textField}
                      value={profileNeighborhood}
                      onChangeText={setProfileNeighborhood}
                      placeholder="Bairro"
                      placeholderTextColor="#8A928B"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.cityField]}>
                    <Text style={styles.fieldLabel}>Cidade</Text>
                    <TextInput
                      style={styles.textField}
                      value={profileCity}
                      onChangeText={setProfileCity}
                      placeholder="Cidade"
                      placeholderTextColor="#8A928B"
                    />
                  </View>
                  <View style={[styles.formGroup, styles.stateField]}>
                    <Text style={styles.fieldLabel}>UF</Text>
                    <TextInput
                      style={styles.textField}
                      value={profileState}
                      onChangeText={(value) => setProfileState(value.toUpperCase())}
                      placeholder="SP"
                      placeholderTextColor="#8A928B"
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveDataBtn, savingProfile && styles.saveDataBtnDisabled]}
              onPress={handleSaveProfileData}
              disabled={savingProfile}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons name="content-save-outline" size={17} color="#FFFFFF" />
              <Text style={styles.saveDataText}>{savingProfile ? 'Salvando...' : 'Salvar dados'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  avatarLift: { alignItems: 'center', marginTop: 0 },
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F7F8F4',
    shadowColor: '#7B8B8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
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
  caseStats: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  caseStatText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
  emptyCases: {
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  emptyCasesText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A928B' },
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
  dataOverlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dataBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 27, 20, 0.34)',
  },
  dataSheet: {
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
  dataHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCE4DA',
    marginBottom: 12,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },
  dataHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
  },
  dataHeaderText: { flex: 1, gap: 2 },
  dataTitle: { fontSize: 17, fontFamily: 'Montserrat_700Bold', color: '#1C251D' },
  dataSubtitle: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#7C867C' },
  dataCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4EF',
  },
  formGroup: { gap: 5, marginBottom: 10 },
  fieldLabel: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#6B756C', marginLeft: 2 },
  textField: {
    minHeight: 42,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: '#F7F9F6',
    borderWidth: 1,
    borderColor: '#E4EAE5',
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1C251D',
  },
  cepLoadingText: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#2D6A4F', marginLeft: 2 },
  addressFields: { marginTop: 2 },
  microRow: { flexDirection: 'row', gap: 8 },
  numberField: { width: 86 },
  complementField: { flex: 1 },
  neighborhoodField: { flex: 1.1 },
  cityField: { flex: 1 },
  stateField: { width: 58 },
  saveDataBtn: {
    marginTop: 6,
    minHeight: 46,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    shadowColor: '#2D6A4F',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  saveDataBtnDisabled: { opacity: 0.62 },
  saveDataText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
