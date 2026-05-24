import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Post, PostType, POST_TYPE_CONFIG } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { geocodeAddress, getPlaceAddressDetails, getStaticMapUrl, searchAddressSuggestions } from '@/services/zoohelpApi';
import { ZooHelpApiError } from '@/services/zoohelpEngine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/* Post type config with icons */
const POST_TYPES: Array<{
  type: PostType;
  icon: MCIcon;
  label: string;
  color: string;
  light: string;
  cta: string;
}> = [
  { type: 'post',      icon: 'pencil-outline', label: 'Escrever',   color: '#6B7B6B', light: '#6B7B6B15', cta: 'Publicar post' },
  { type: 'adoption',  icon: 'home-heart',     label: 'Adoção',     color: '#2D6A4F', light: '#2D6A4F15', cta: 'Publicar para adoção' },
  { type: 'lost',      icon: 'magnify',        label: 'Perdido',    color: '#D4A259', light: '#D4A25915', cta: 'Reportar animal perdido' },
  { type: 'found',     icon: 'check-circle',   label: 'Encontrado', color: '#2C5F8A', light: '#2C5F8A15', cta: 'Reportar animal encontrado' },
  { type: 'emergency', icon: 'alert-circle',   label: 'Emergência', color: '#C95A5A', light: '#C95A5A15', cta: 'Pedir ajuda urgente' },
  { type: 'campaign',  icon: 'heart-multiple', label: 'Campanha',   color: '#6B5B8A', light: '#6B5B8A15', cta: 'Lançar campanha' },
];

const ANIMAL_OPTIONS: Array<{ value: 'dog' | 'cat' | 'other'; icon: MCIcon; label: string }> = [
  { value: 'dog',   icon: 'dog',  label: 'Cachorro' },
  { value: 'cat',   icon: 'cat',  label: 'Gato' },
  { value: 'other', icon: 'paw',  label: 'Outro' },
];

const STEPS = ['Tipo', 'Conteúdo', 'Mídia', 'Publicar'];

/* Animated pill */
function TypePill({
  item,
  isActive,
  onPress,
}: {
  item: typeof POST_TYPES[0];
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function press() {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    });
    onPress();
  }

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        style={[
          styles.typePill,
          {
            backgroundColor: isActive ? item.color : '#F0F2F5',
            borderColor: isActive ? item.color : 'transparent',
            shadowColor: isActive ? item.color : 'transparent',
          },
        ]}
        onPress={press}
        activeOpacity={1}
      >
        <MaterialCommunityIcons name={item.icon} size={13} color={isActive ? '#FFFFFF' : '#6E6E73'} />
        <Text style={[styles.typePillLabel, { color: isActive ? '#FFFFFF' : '#6E6E73' }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ComposeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string; type?: string; rescue?: string }>();
  const { addPost, isAuthenticated, isLoading, user } = useApp();
  const requestedType = typeof params.type === 'string' ? params.type : undefined;
  const requestedIntent = typeof params.intent === 'string' ? params.intent : undefined;
  const initialType = POST_TYPES.some((t) => t.type === requestedType)
    ? (requestedType as PostType)
    : 'adoption';

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<PostType>(initialType);
  const [animalType, setAnimalType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressResult, setAddressResult] = useState<{ label: string; latitude: number; longitude: number } | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPrecision, setLocationPrecision] = useState<'none' | 'city' | 'address' | 'gps'>('none');
  const [addressLookupFailed, setAddressLookupFailed] = useState(false);
  const [addressManualFallbackVisible, setAddressManualFallbackVisible] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [manualNeighborhood, setManualNeighborhood] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(requestedIntent === 'help' || initialType === 'emergency');
  const [submitting, setSubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  // ========== AUTOCOMPLETE DE ENDEREÇO MANUAL ==========
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  // Função para buscar sugestões de endereço
  async function fetchPlaceSuggestions(input: string) {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const items = await searchAddressSuggestions(input);
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
      if (items.length === 0) {
        setAddressLookupFailed(true);
        setAddressManualFallbackVisible(true);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
      setAddressLookupFailed(true);
      setAddressManualFallbackVisible(true);
    }
  }

  // Função para quando o usuário seleciona uma sugestão
  async function selectSuggestion(placeId: string, description: string) {
    setShowSuggestions(false);
    setLocation(description);
    setAddressSearching(true);

    try {
      const result = await getPlaceAddressDetails(placeId) ?? await geocodeAddress(description);
      if (result) {
        const lat = result.latitude;
        const lng = result.longitude;
        const formattedAddress = result.label || description;
        
        setCoords({ latitude: lat, longitude: lng });
        setLocationPrecision('address');
        setAddressResult({ label: formattedAddress, latitude: lat, longitude: lng });
        setLocation(formattedAddress);
        setAddressLookupFailed(false);
        
        const staticMap = await getStaticMapUrl({
          lat, lng, zoom: 16, width: 640, height: 320
        });
        if (staticMap) setMapImageUrl(staticMap);
      }
    } catch {
      // Keep manual address entry available when geocoding is unavailable.
    } finally {
      setAddressSearching(false);
    }
  }

  // Handler para mudança no texto com debounce
  function handleLocationChange(text: string) {
    setLocation(text);
    setCoords(null);
    setAddressResult(null);
    setMapImageUrl(null);
    setAddressLookupFailed(false);
    setAddressManualFallbackVisible(false);
    if (locationPrecision !== 'gps') setLocationPrecision('none');
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    const timeout = setTimeout(() => {
      fetchPlaceSuggestions(text);
    }, 300);
    setTypingTimeout(timeout);
  }
  // ========== FIM DO AUTOCOMPLETE ==========
  const inputBorder = useSharedValue(0);
  const urgentPulse = useSharedValue(1);

  const topPad = (Platform.OS === 'web' ? 0 : insets.top) + 16;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;

  const currentType = POST_TYPES.find((t) => t.type === selectedType)!;
  const canPost = text.trim().length > 0 || images.length > 0;
  const displayName = user?.name ?? '';
  const authorRoleLabel = user?.type === 'ong'
    ? 'ONG'
    : user?.type === 'vet'
    ? 'Veterinário'
    : user?.gender === 'female'
    ? 'Autora'
    : 'Autor';

  useEffect(() => {
    const query = location.trim();
    setAddressResult(null);
    if (query.length < 6 || locationPrecision === 'gps' || (Platform.OS === 'web' && showSuggestions)) {
      setAddressSearching(false);
      if (query.length < 3 || locationPrecision === 'gps') {
        setAddressLookupFailed(false);
        setAddressManualFallbackVisible(false);
      }
      return;
    }

    setAddressSearching(true);
    setAddressLookupFailed(false);
    setAddressManualFallbackVisible(false);
    const fallbackTimer = setTimeout(() => setAddressManualFallbackVisible(true), 900);
    const timer = setTimeout(() => {
      geocodeAddress(query)
        .then(async (result) => {
          if (!result) {
            setAddressResult(null);
            setAddressLookupFailed(true);
            setAddressManualFallbackVisible(true);
            return;
          }
          setAddressManualFallbackVisible(false);
          const nextCoords = { latitude: result.latitude, longitude: result.longitude };
          setAddressResult({ label: result.label, ...nextCoords });
          setCoords(nextCoords);
          setLocationPrecision('address');
          const staticMap = await getStaticMapUrl({
            lat: result.latitude,
            lng: result.longitude,
            zoom: 16,
            width: 640,
            height: 320,
          });
          if (staticMap) setMapImageUrl(staticMap);
        })
        .catch(() => {
          setAddressResult(null);
          setAddressLookupFailed(true);
          setAddressManualFallbackVisible(true);
        })
        .finally(() => setAddressSearching(false));
    }, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
      setAddressSearching(false);
    };
  }, [location, locationPrecision, showSuggestions]);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  const currentUser = user;

  function selectType(type: PostType) {
    setSelectedType(type);
    if (type === 'emergency') setUrgent(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function toggleUrgent() {
    const next = !urgent;
    setUrgent(next);
    urgentPulse.value = withSpring(next ? 1.08 : 1, { damping: 8, stiffness: 200 });
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(
        next ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      );
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
    }
  }

  async function detectLocation() {
    if (Platform.OS === 'web') {
      Alert.alert('GPS indisponivel', 'Use o app mobile para capturar GPS real.');
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão de localização', 'Autorize a localização para enviar ajuda próxima com precisão.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });
      setLocationPrecision('gps');
      setAddressLookupFailed(false);
      setAddressManualFallbackVisible(false);
      setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

      const staticMap = await getStaticMapUrl({
        lat: latitude,
        lng: longitude,
        zoom: 14,
        width: 640,
        height: 320,
      });
      if (staticMap) setMapImageUrl(staticMap);
    } catch {
      Alert.alert('Localização indisponível', 'Não foi possível capturar sua localização agora.');
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  function buildAddressLabel() {
    if (addressResult?.label) return addressResult.label;
    const street = [location.trim(), manualNumber.trim()].filter(Boolean).join(', ');
    const cityState = [manualCity.trim(), manualState.trim()].filter(Boolean).join(' - ');
    const manualLabel = [street, manualNeighborhood.trim(), cityState].filter(Boolean).join(', ');
    return manualLabel || location.trim();
  }

  async function handlePublish() {
    if (!canPost) {
      Alert.alert('Publicação vazia', 'Escreva algo ou adicione uma foto.');
      return;
    }
    const needsRescue = selectedType === 'emergency' || urgent || params.rescue === '1';
    const manualAddress = buildAddressLabel();
    let nextCoords = coords;
    let nextPrecision = locationPrecision;
    let nextLocation = manualAddress || location;

    if (manualAddress && nextPrecision !== 'gps') {
      const geocoded = await geocodeAddress(manualAddress).catch(() => null);
      if (geocoded) {
        nextCoords = { latitude: geocoded.latitude, longitude: geocoded.longitude };
        nextPrecision = 'address';
        nextLocation = geocoded.label;
        setCoords(nextCoords);
        setLocationPrecision(nextPrecision);
        setLocation(geocoded.label);
        const staticMap = await getStaticMapUrl({
          lat: geocoded.latitude,
          lng: geocoded.longitude,
          zoom: 16,
          width: 640,
          height: 320,
        });
        if (staticMap) setMapImageUrl(staticMap);
      } else {
        nextLocation = manualAddress;
        setAddressLookupFailed(true);
      }
    }

    const hasOperationalCoords = Boolean(nextCoords && nextPrecision !== 'city');
    if (needsRescue && !hasOperationalCoords && Platform.OS !== 'web') {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Localização obrigatória', 'Autorize o GPS para acionar resgate e notificar pessoas próximas.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      nextPrecision = 'gps';
      nextLocation = location.trim() || 'Localização atual';
      setCoords(nextCoords);
      setLocationPrecision(nextPrecision);
      setLocation(nextLocation);
    }
    const shouldAttachCoords = Boolean(nextCoords && (!needsRescue || nextPrecision !== 'city'));
    setSubmitting(true);
    if (Platform.OS !== 'web')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: selectedType,
      animalType,
      name: text.trim().split(' ').slice(0, 2).join(' ') || 'Publicação',
      breed: '',
      age: '',
      description: text.trim(),
      location: nextLocation.trim() || 'Localização não informada',
      neighborhood: nextLocation.trim() || 'Local não informado',
      image: images[0] ?? null,
      images,
      latitude: shouldAttachCoords ? nextCoords?.latitude : undefined,
      longitude: shouldAttachCoords ? nextCoords?.longitude : undefined,
      textOnly: images.length === 0,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        verified: currentUser.verified,
        type: currentUser.type,
      },
      likes: 0,
      comments: 0,
      shares: 0,
      urgent,
      createdAt: 'agora',
      contact: contact.trim(),
      tags: [],
    };

    try {
      const savedPost = await addPost(newPost);
      if (needsRescue && shouldAttachCoords) {
        const addressParam = encodeURIComponent(newPost.location);
        router.replace(`/rescue/status?postId=${encodeURIComponent(savedPost.id)}&address=${addressParam}` as any);
      } else if (needsRescue) {
        Alert.alert(
          'Publicado como urgente',
          'O post foi criado com o endereço informado. Para disparo operacional em raio preciso, use GPS do app ou um endereço geocodificado.'
        );
        router.back();
      } else {
        router.back();
      }
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 401) {
        Alert.alert('Sessão expirada', 'Entre novamente para publicar um caso real.');
        router.replace('/login');
      } else {
        Alert.alert('Erro ao publicar', 'Não foi possível publicar agora. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputAnimStyle = useAnimatedStyle(() => ({
    borderColor: inputBorder.value === 1
      ? currentType.color
      : '#E8ECF0',
    shadowOpacity: inputBorder.value === 1 ? 0.12 : 0,
  }));

  const urgentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: urgentPulse.value }],
  }));

  const progress = Math.min(
    ((text.trim().length > 0 ? 1 : 0) + (images.length > 0 ? 1 : 0) + (location.trim().length > 0 ? 1 : 0)) / 3,
    1
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAF8' }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nova publicação</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: currentType.color, width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.publishTopBtn,
            { backgroundColor: canPost ? currentType.color : colors.muted },
          ]}
          onPress={handlePublish}
          disabled={!canPost || submitting}
          activeOpacity={0.85}
        >
          <Text style={[styles.publishTopText, { color: canPost ? '#FFFFFF' : colors.mutedForeground }]}>
            {submitting ? '...' : 'Publicar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* AUTHOR CARD */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.authorRow}>
            <Avatar
              name={displayName}
              size={38}
              verified={user?.verified}
              type={user?.type}
              imageUrl={user?.avatar}
              bgColor={currentType.color}
            />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: colors.foreground }]}>{displayName}</Text>
                {user?.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={13} color="#7B8B8B" />
                )}
              </View>
              <View style={styles.authorMeta}>
                <View style={[styles.roleBadge, { backgroundColor: currentType.light }]}>
                  <Text style={[styles.roleText, { color: currentType.color }]}>
                    {authorRoleLabel}
                  </Text>
                </View>
                <View style={[styles.audienceBadge, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons name="earth" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.audienceText, { color: colors.mutedForeground }]}>Público</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* POST TYPE SELECTOR */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Qual é a situação?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}
          >
            {POST_TYPES.map((t) => (
              <TypePill
                key={t.type}
                item={t}
                isActive={selectedType === t.type}
                onPress={() => selectType(t.type)}
              />
            ))}
          </ScrollView>
        </View>

        {/* COMPOSER */}
        <Animated.View style={[styles.sectionAnimated, styles.composerCard, inputAnimStyle]}>
          <TextInput
            style={[styles.composer, { color: colors.foreground }]}
            placeholder={
              selectedType === 'post'
                ? 'Compartilhe algo com a comunidade ZooHelp...'
                : selectedType === 'adoption'
                ? 'Descreva o animal: comportamento, saúde, necessidades...'
                : selectedType === 'lost'
                ? 'Onde e quando desapareceu? Como é o animal?'
                : selectedType === 'found'
                ? 'Onde e quando encontrou? Como está o animal?'
                : selectedType === 'emergency'
                ? 'Descreva a emergência com detalhes urgentes...'
                : 'Descreva a campanha e o impacto que ela terá...'
            }
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus={false}
            textAlignVertical="top"
            maxLength={1200}
            onFocus={() => {
              setInputFocused(true);
              inputBorder.value = withTiming(1, { duration: 200 });
            }}
            onBlur={() => {
              setInputFocused(false);
              inputBorder.value = withTiming(0, { duration: 200 });
            }}
          />
          <View style={styles.composerFooter}>
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {text.length > 0 ? `${text.length}/1200` : ''}
            </Text>
          </View>
        </Animated.View>

        {/* ANIMAL TYPE + HEALTH TAGS - oculto para posts de texto */}
        {selectedType === 'adoption' && (
          <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Tipo de animal</Text>
              <View style={styles.animalGrid}>
                {ANIMAL_OPTIONS.map((a) => {
                  const isActive = animalType === a.value;
                  return (
                    <TouchableOpacity
                      key={a.value}
                      style={[
                        styles.animalCard,
                        {
                          backgroundColor: isActive ? currentType.light : colors.muted,
                          borderColor: isActive ? currentType.color : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setAnimalType(a.value);
                        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name={a.icon} size={26} color={isActive ? currentType.color : colors.mutedForeground} />
                      <Text style={[styles.animalLabel, { color: isActive ? currentType.color : colors.mutedForeground }]}>
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

        )}

        {/* MEDIA SECTION */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.mediaTitleRow}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Fotos</Text>
            <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>
              {images.length}/4 · fotos aumentam 3x as chances de ajuda
            </Text>
          </View>
          <View style={styles.mediaGrid}>
            {images.map((uri, i) => (
              <View key={uri} style={styles.mediaThumb}>
                <Image source={{ uri }} style={styles.mediaImg} contentFit="cover" />
                {i === 0 && (
                  <View style={styles.mediaMainBadge}>
                    <Text style={styles.mediaMainText}>Capa</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.mediaRemove} onPress={() => removeImage(uri)}>
                  <MaterialCommunityIcons name="close" size={11} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity
                style={[styles.mediaAdd, { borderColor: currentType.color, backgroundColor: currentType.light }]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={22} color={currentType.color} />
                <Text style={[styles.mediaAddText, { color: currentType.color }]}>Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LOCATION */}
<View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Localização</Text>
  
  <View style={{ position: 'relative', zIndex: 1000 }}>
    <View style={styles.searchInputContainer}>
      <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentType.color} />
      <TextInput
        style={styles.searchInputText}
        placeholder="Digite rua, número e cidade"
        placeholderTextColor="#8A928B"
        value={location}
        onChangeText={handleLocationChange}
        returnKeyType="search"
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
      />
      {addressLookupFailed && location.trim().length >= 3 && (
        <TextInput
          style={styles.manualNumberInput}
          value={manualNumber}
          onChangeText={setManualNumber}
          placeholder="Nº"
          placeholderTextColor="#8A928B"
          keyboardType="numbers-and-punctuation"
        />
      )}
    </View>
    {(addressLookupFailed || addressManualFallbackVisible) && location.trim().length >= 3 && (
      <View style={styles.manualLocationRow}>
        <TextInput
          style={styles.manualLocationInput}
          value={manualNeighborhood}
          onChangeText={setManualNeighborhood}
          placeholder="Bairro"
          placeholderTextColor="#8A928B"
        />
        <TextInput
          style={styles.manualLocationInput}
          value={manualCity}
          onChangeText={setManualCity}
          placeholder="Cidade"
          placeholderTextColor="#8A928B"
        />
        <TextInput
          style={[styles.manualLocationInput, styles.manualStateInput]}
          value={manualState}
          onChangeText={(value) => setManualState(value.toUpperCase())}
          placeholder="UF"
          placeholderTextColor="#8A928B"
          maxLength={2}
          autoCapitalize="characters"
        />
      </View>
    )}
    
    {/* Lista de sugestões flutuante */}
    {showSuggestions && suggestions.length > 0 && (
      <View style={[styles.suggestionsList, { backgroundColor: '#FFFFFF' }]}>
        <ScrollView style={{ maxHeight: 200 }}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item.id, item.label)}
            >
              <MaterialCommunityIcons name="map-marker" size={16} color="#7C867C" />
              <Text style={[styles.suggestionText, { color: '#1D2A20' }]} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )}
  </View>
  
  {addressSearching && (
    <Text style={[styles.addressStatusText, { color: colors.mutedForeground }]}>Buscando endereço...</Text>
  )}
  
  {addressResult && (
    <View style={[styles.addressResultBox, { backgroundColor: currentType.light }]}>
      <MaterialCommunityIcons name="check-circle-outline" size={15} color={currentType.color} />
      <Text style={[styles.addressResultText, { color: colors.foreground }]} numberOfLines={2}>
        {addressResult.label}
      </Text>
    </View>
  )}
  
</View>

        {/* CONTACT */}
<View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Contato</Text>
  <View style={styles.searchInputContainer}>
    <MaterialCommunityIcons name="phone-outline" size={16} color={currentType.color} />
    <TextInput
      style={styles.searchInputText}
      placeholder="WhatsApp ou telefone (opcional)"
      placeholderTextColor="#8A928B"
      value={contact}
      onChangeText={setContact}
      keyboardType="phone-pad"
    />
  </View>
</View>

        {/* URGENCY */}
        <Animated.View style={[urgentStyle]}>
          <TouchableOpacity
            style={[
              styles.urgentCard,
              {
                backgroundColor: urgent ? '#C95A5A08' : '#FFFFFF',
                borderColor: urgent ? '#C95A5A' : colors.border,
              },
            ]}
            onPress={toggleUrgent}
            activeOpacity={0.92}
          >
            <View style={[styles.urgentIcon, { backgroundColor: urgent ? '#C95A5A' : colors.muted }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color={urgent ? '#FFFFFF' : colors.mutedForeground} />
            </View>
            <View style={styles.urgentInfo}>
              <Text style={[styles.urgentTitle, { color: urgent ? '#C95A5A' : colors.foreground }]}>
                Marcar como URGENTE
              </Text>
              <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
                Aparece em destaque no feed e notifica usuários próximos
              </Text>
            </View>
            <View style={[styles.toggleTrack, { backgroundColor: urgent ? '#C95A5A' : colors.muted }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: urgent ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* TRUST SYSTEM */}
        <View style={[styles.section, styles.trustCard, { backgroundColor: '#2F80ED08', borderColor: '#2F80ED30' }]}>
          <View style={styles.trustHeader}>
            <MaterialCommunityIcons name="shield-outline" size={16} color="#2F80ED" />
            <Text style={[styles.trustTitle, { color: '#2F80ED' }]}>Sistema de confiança ZooHelp</Text>
          </View>
          {[
            { icon: 'account-check' as MCIcon,  text: 'Sua identidade é verificada pela plataforma' },
            { icon: 'eye-outline' as MCIcon,    text: 'Denúncias são monitoradas em tempo real' },
            { icon: 'lock-outline' as MCIcon,   text: 'Doações com rastreabilidade total' },
          ].map((item) => (
            <View key={item.text} style={styles.trustRow}>
              <MaterialCommunityIcons name={item.icon} size={13} color="#2F80ED" />
              <Text style={[styles.trustText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* BOTTOM DOCK */}
      <View
        style={[
          styles.dock,
          { borderTopColor: colors.border, paddingBottom: bottomPad + 6 },
        ]}
      >
        <View style={styles.dockIcons}>
          {[
            { icon: 'image-outline' as MCIcon, color: '#2D6A4F', label: 'Foto', onPress: pickImage },
            { icon: 'map-marker-outline' as MCIcon, color: '#D4A259', label: 'Local', onPress: detectLocation },
          ].map(({ icon, color, label, onPress }) => (
            <TouchableOpacity key={icon} style={styles.dockBtn} onPress={onPress} activeOpacity={0.7}>
              <View style={[styles.dockIcon, { backgroundColor: color + '18', borderColor: color + '30', shadowColor: color }]}>
                <MaterialCommunityIcons name={icon} size={18} color={color} />
              </View>
              <Text style={[styles.dockLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.publishBtn,
            { backgroundColor: canPost ? currentType.color : colors.muted, shadowColor: canPost ? currentType.color : 'transparent' },
          ]}
          onPress={handlePublish}
          disabled={!canPost || submitting}
          activeOpacity={0.88}
        >
          {canPost && <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />}
          <Text style={[styles.publishText, { color: canPost ? '#FFFFFF' : colors.mutedForeground }]}>
            {submitting ? 'Publicando...' : currentType.cta}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: { minHeight: 44, justifyContent: 'center', paddingRight: 4 },
  cancelText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 5 },
  headerTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  progressBar: {
    width: 80,
    height: 3,
    backgroundColor: '#E8ECF0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 2 },
  publishTopBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  publishTopText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  /* scroll */
  scroll: { flex: 1 },
  scrollContent: { gap: 8, paddingTop: 8, paddingHorizontal: 0 },

  /* sections */
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
  sectionAnimated: {
    marginHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 12,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* type pills */
  typeRow: { gap: 5, paddingBottom: 2 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  typePillEmoji: { fontSize: 12 },
  typePillLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  /* author */
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorInfo: { flex: 1, gap: 3 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  authorMeta: { flexDirection: 'row', gap: 6 },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  audienceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  audienceText: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  /* composer */
  composerCard: { padding: 16, gap: 8 },
  composer: {
    fontSize: 13,
    paddingHorizontal: 5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 25,
    minHeight: 70,
    paddingTop: 0,
  },
  composerFooter: { alignItems: 'flex-end' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  /* animal */
  animalGrid: { flexDirection: 'row', gap: 9, paddingHorizontal: 0, },
  animalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 6,
  },
  /* inputs no estilo da busca */
searchInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: '#F4F6F3',
  borderWidth: 1,
  borderColor: '#E4EAE5',
  borderRadius: 17,
  paddingHorizontal: 12,
  minHeight: 44,
},
searchInputText: {
  flex: 1,
  fontSize: 13,
  fontFamily: 'Inter_400Regular',
  color: '#1D2A20',
  padding: 0,
},
manualLocationRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 8,
},
manualNumberInput: {
  width: 44,
  height: 28,
  borderWidth: 1,
  borderColor: '#E4EAE5',
  borderRadius: 10,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 7,
  paddingVertical: 0,
  fontSize: 11,
  fontFamily: 'Inter_700Bold',
  color: '#1D2A20',
  textAlign: 'center',
},
manualLocationInput: {
  flex: 1,
  height: 30,
  borderWidth: 1,
  borderColor: '#E4EAE5',
  borderRadius: 11,
  backgroundColor: '#F4F6F3',
  paddingHorizontal: 9,
  paddingVertical: 0,
  fontSize: 11,
  fontFamily: 'Inter_600SemiBold',
  color: '#1D2A20',
},
manualStateInput: {
  flex: 0,
  width: 50,
  textAlign: 'center',
},
  animalEmoji: { fontSize: 20 },
  animalLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  /* health tags */
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
  },
  healthTagText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  /* media */
  mediaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mediaHint: { fontSize: 10, fontFamily: 'Inter_400Regular', maxWidth: 180, textAlign: 'right' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaThumb: {
    width: 88, height: 88, borderRadius: 14, overflow: 'hidden', position: 'relative',
  },
  mediaImg: { width: '100%', height: '100%' },
  mediaMainBadge: {
    position: 'absolute', bottom: 5, left: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  mediaMainText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  mediaRemove: {
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  mediaAdd: {
    width: 88, height: 88, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  mediaAddText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  /* location */
  locationInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13,
  },
  locationText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addressStatusText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: -4,
    paddingHorizontal: 2,
  },
  addressResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 13,
  },
  addressResultText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  mapPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12,
    minHeight: 74,
    overflow: 'hidden',
  },
  mapPreviewImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.72,
  },
  mapPreviewText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', zIndex: 1 },
  autoLocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    zIndex: 1,
  },
  autoLocText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },

  /* urgency */
  urgentCard: {
    marginHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 20, borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  urgentIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  urgentInfo: { flex: 1, gap: 3 },
  urgentTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  urgentDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  toggleTrack: {
    width: 44, height: 26, borderRadius: 13, justifyContent: 'center',
  },
  toggleKnob: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },

  /* trust */
  trustCard: {
    marginHorizontal: 12,
    borderRadius: 20, padding: 14, borderWidth: 1,
    gap: 8,
  },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },

  /* dock */
  dock: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  dockIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dockBtn: { alignItems: 'center', gap: 4 },
  dockIcon: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
  dockLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
    /* autocomplete */
  suggestionsList: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    backgroundColor: '#FFFFFF',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8ECF0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  publishText: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.1 },
});
