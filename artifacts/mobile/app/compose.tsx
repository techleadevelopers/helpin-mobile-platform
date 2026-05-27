import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimalTypeSelector,
  ComposeDock,
  ComposeHeader,
  ComposeLocationSection,
  ComposeTextCard,
  ComposeTypeSelector,
  ComposeUrgencyCard,
  POST_TYPES,
  type AddressResult,
  type AddressSuggestion,
} from '@/components/composer';
import { Post, PostType } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { geocodeAddress, geocodeStructuredAddress, getPlaceAddressDetails, getStaticMapUrl, searchAddressSuggestions } from '@/services/zoohelpApi';
import { ZooHelpApiError } from '@/services/zoohelpEngine';

const BRAZIL_STATE_TO_UF: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

function toBrazilStateCode(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^estado de\s+/i, '')
    .replace(/^state of\s+/i, '')
    .toLowerCase();
  return BRAZIL_STATE_TO_UF[normalized] ?? '';
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

  const [selectedType, setSelectedType] = useState<PostType>(initialType);
  const [animalType, setAnimalType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressResult, setAddressResult] = useState<AddressResult | null>(null);
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const inputBorder = useSharedValue(0);

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
          lat, lng, zoom: 16, width: 640, height: 320,
        });
        if (staticMap) setMapImageUrl(staticMap);
      }
    } catch {
      // Keep manual address entry available when geocoding is unavailable.
    } finally {
      setAddressSearching(false);
    }
  }

  function handleLocationChange(nextText: string) {
    setLocation(nextText);
    setCoords(null);
    setAddressResult(null);
    setMapImageUrl(null);
    setAddressLookupFailed(false);
    setAddressManualFallbackVisible(false);
    if (locationPrecision !== 'gps') setLocationPrecision('none');

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      fetchPlaceSuggestions(nextText);
    }, 300);
    setTypingTimeout(timeout);
  }

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
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        next ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      );
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, 4));
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((item) => item !== uri));
  }

  function buildAddressLabel() {
    const street = [location.trim(), manualNumber.trim()].filter(Boolean).join(', ');
    const cityState = [manualCity.trim(), manualState.trim()].filter(Boolean).join(' - ');
    const manualLabel = [street, manualNeighborhood.trim(), cityState].filter(Boolean).join(', ');
    if (hasAnyManualLocationPart()) return manualLabel || location.trim();
    if (addressResult?.label) return addressResult.label;
    return manualLabel || location.trim();
  }

  function getManualLocationParts() {
    return {
      street: location.trim(),
      number: manualNumber.trim(),
      neighborhood: manualNeighborhood.trim(),
      city: manualCity.trim(),
      state: manualState.trim().toUpperCase(),
    };
  }

  function hasAnyManualLocationPart() {
    const parts = getManualLocationParts();
    return Boolean(parts.number || parts.neighborhood || parts.city || parts.state);
  }

  function hasCompleteManualLocation() {
    const parts = getManualLocationParts();
    return Boolean(parts.street && parts.number && parts.neighborhood && parts.city && parts.state.length === 2);
  }

  function geocodeWithQuickTimeout(address: string) {
    return Promise.race([
      geocodeAddress(address).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
  }

  function geocodeManualAddressWithQuickTimeout() {
    const parts = getManualLocationParts();
    return Promise.race([
      geocodeStructuredAddress(parts)
        .then((result) => result ?? geocodeAddress(buildAddressLabel()))
        .catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
  }

  async function handleUseGps() {
    setAddressSearching(true);
    setShowSuggestions(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('GPS bloqueado', 'Permita o acesso a localização para preencher o endereco automaticamente.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextCoords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      const [address] = await Location.reverseGeocodeAsync(nextCoords);
      const street = [address?.street, address?.name].find((value) => value?.trim())?.trim() ?? '';
      const number = address?.streetNumber?.trim() ?? '';
      const neighborhood = [address?.district, address?.subregion].find((value) => value?.trim())?.trim() ?? '';
      const city = [address?.city, address?.subregion].find((value) => value?.trim())?.trim() ?? '';
      const state = toBrazilStateCode(address?.region);
      const cityState = [city, state].filter(Boolean).join(' - ');
      const label = [
        [street, number].filter(Boolean).join(', '),
        neighborhood,
        cityState,
      ].filter(Boolean).join(', ');

      setCoords(nextCoords);
      setLocationPrecision('gps');
      setLocation(label || `${nextCoords.latitude}, ${nextCoords.longitude}`);
      setManualNumber(number);
      setManualNeighborhood(neighborhood);
      setManualCity(city);
      setManualState(state);
      setAddressResult({
        label: label || 'Localização atual',
        ...nextCoords,
      });
      setAddressLookupFailed(false);
      setAddressManualFallbackVisible(false);

      const staticMap = await getStaticMapUrl({
        lat: nextCoords.latitude,
        lng: nextCoords.longitude,
        zoom: 17,
        width: 640,
        height: 320,
      });
      if (staticMap) setMapImageUrl(staticMap);
    } catch {
      Alert.alert('GPS indisponivel', 'Nao foi possivel buscar sua localização agora. Preencha o endereco manualmente.');
      setAddressLookupFailed(true);
      setAddressManualFallbackVisible(true);
    } finally {
      setAddressSearching(false);
    }
  }

  async function handlePublish() {
    if (!canPost) {
      Alert.alert('Publicação vazia', 'Escreva algo ou adicione uma foto.');
      return;
    }
    const needsRescue = selectedType === 'emergency' || urgent || params.rescue === '1';
    const manualAddress = buildAddressLabel();
    const manualComplete = hasCompleteManualLocation();
    let nextCoords = coords;
    let nextPrecision = locationPrecision;
    let nextLocation = manualAddress || location;

    if (manualComplete) {
      nextCoords = null;
      nextPrecision = 'address';
      nextLocation = manualAddress;
      setLocation(nextLocation);
      setLocationPrecision(nextPrecision);
    }

    const locationAddress = manualComplete ? getManualLocationParts() : undefined;
    const shouldSendClientCoords = Boolean(nextCoords && nextPrecision === 'gps');
    setSubmitting(true);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: selectedType,
      animalType,
      name: text.trim().split(' ').slice(0, 2).join(' ') || 'Publicação',
      breed: '',
      age: '',
      description: text.trim(),
      location: nextLocation.trim() || 'Localização não informada',
      neighborhood: locationAddress?.neighborhood || nextLocation.trim() || 'Local não informado',
      image: images[0] ?? null,
      images,
      latitude: shouldSendClientCoords ? nextCoords?.latitude : undefined,
      longitude: shouldSendClientCoords ? nextCoords?.longitude : undefined,
      geoSource: shouldSendClientCoords ? 'gps_confirmed' : undefined,
      routePublic: needsRescue || selectedType === 'lost' || selectedType === 'found',
      locationAddress,
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
      await addPost(newPost);
      router.replace('/(tabs)/feed' as any);
    } catch (error) {
      if (error instanceof ZooHelpApiError && error.status === 401) {
        Alert.alert('Sessão expirada', 'Entre novamente para publicar um caso real.');
        router.replace('/login');
      } else {
        const message =
          error instanceof ZooHelpApiError
            ? error.message.replace(/^validation error:\s*/i, '')
            : 'Não foi possível publicar agora. Tente novamente.';
        Alert.alert('Erro ao publicar', message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputAnimStyle = useAnimatedStyle(() => ({
    borderColor: inputBorder.value === 1 ? currentType.color : '#E8ECF0',
    shadowOpacity: inputBorder.value === 1 ? 0.12 : 0,
  }));

  const progress = Math.min(
    ((text.trim().length > 0 ? 1 : 0) + (images.length > 0 ? 1 : 0) + (location.trim().length > 0 ? 1 : 0)) / 3,
    1
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAF8' }]}>
      <ComposeHeader
        topPad={topPad}
        colors={colors}
        currentType={currentType}
        progress={progress}
        onCancel={() => router.back()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ComposeTypeSelector
          user={currentUser}
          displayName={displayName}
          authorRoleLabel={authorRoleLabel}
          colors={colors}
          currentType={currentType}
          postTypes={POST_TYPES}
          selectedType={selectedType}
          onSelectType={selectType}
        />

        <ComposeTextCard
          selectedType={selectedType}
          text={text}
          images={images}
          colors={colors}
          currentType={currentType}
          animatedStyle={inputAnimStyle}
          onChangeText={setText}
          onFocus={() => {
            inputBorder.value = withTiming(1, { duration: 200 });
          }}
          onBlur={() => {
            inputBorder.value = withTiming(0, { duration: 200 });
          }}
          onPickImage={pickImage}
          onRemoveImage={removeImage}
        />

        {selectedType !== 'campaign' && selectedType !== 'post' && (
          <AnimalTypeSelector
            animalType={animalType}
            colors={colors}
            currentType={currentType}
            onSelectAnimal={(value) => {
              setAnimalType(value);
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        )}

        <ComposeLocationSection
          location={location}
          manualNumber={manualNumber}
          manualNeighborhood={manualNeighborhood}
          manualCity={manualCity}
          manualState={manualState}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          addressSearching={addressSearching}
          addressResult={addressResult}
          addressLookupFailed={addressLookupFailed}
          addressManualFallbackVisible={addressManualFallbackVisible}
          colors={colors}
          currentType={currentType}
          contact={contact}
          locationPrecision={locationPrecision}
          onChangeLocation={handleLocationChange}
          onChangeManualNumber={setManualNumber}
          onChangeManualNeighborhood={setManualNeighborhood}
          onChangeManualCity={setManualCity}
          onChangeManualState={setManualState}
          onChangeContact={setContact}
          onUseGps={handleUseGps}
          onFocusSuggestions={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlurSuggestions={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onSelectSuggestion={selectSuggestion}
        />

        <ComposeUrgencyCard
          urgent={urgent}
          colors={colors}
          animatedStyle={undefined}
          onToggleUrgent={toggleUrgent}
        />

      </ScrollView>

      <ComposeDock
        bottomPad={bottomPad}
        colors={colors}
        currentType={currentType}
        canPost={canPost}
        submitting={submitting}
        onPublish={handlePublish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { gap: 8, paddingTop: 8, paddingHorizontal: 0 },
});
