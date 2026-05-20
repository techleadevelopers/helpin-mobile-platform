import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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

import { Post, PostType, POST_TYPE_CONFIG } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { getStaticMapUrl } from '@/services/zoohelpApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/* ── Post type config with icons ── */
const POST_TYPES: Array<{
  type: PostType;
  icon: MCIcon;
  label: string;
  color: string;
  light: string;
  cta: string;
}> = [
  { type: 'post',      icon: 'pencil-outline', label: 'Escrever',   color: '#6B7B6B', light: '#6B7B6B15', cta: 'Publicar post' },
  { type: 'adoption',  icon: 'home-heart',     label: 'Adoçío',     color: '#2D6A4F', light: '#2D6A4F15', cta: 'Publicar para adoçío' },
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

const HEALTH_TAGS = ['Vacinado', 'Castrado', 'Microchip', 'Ferido', 'Filhote', 'Idoso', 'Especial'];
const STEPS = ['Tipo', 'Conteúdo', 'Mídia', 'Publicar'];

/* ── Animated pill ── */
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
        <MaterialCommunityIcons name={item.icon} size={16} color={isActive ? '#FFFFFF' : '#6E6E73'} />
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
  const params = useLocalSearchParams<{ intent?: string; type?: string }>();
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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(requestedIntent === 'help' || initialType === 'emergency');
  const [healthTags, setHealthTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const inputBorder = useSharedValue(0);
  const urgentPulse = useSharedValue(1);

  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;

  const currentType = POST_TYPES.find((t) => t.type === selectedType)!;
  const canPost = text.trim().length > 0 || images.length > 0;
  const displayName = user?.name ?? '';

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  const currentUser = user;

  function selectType(type: PostType) {
    setSelectedType(type);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function toggleHealthTag(tag: string) {
    setHealthTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
        Alert.alert('Permissao de localizacao', 'Autorize a localizacao para enviar ajuda proxima com precisao.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });
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
      Alert.alert('Localizacao indisponivel', 'Nao foi possivel capturar sua localizacao agora.');
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  async function handlePublish() {
    if (!canPost) {
      Alert.alert('Publicaçío vazia', 'Escreva algo ou adicione uma foto.');
      return;
    }
    setSubmitting(true);
    if (Platform.OS !== 'web')
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: selectedType,
      animalType,
      name: text.trim().split(' ').slice(0, 2).join(' ') || 'Publicaçío',
      breed: '',
      age: '',
      description: text.trim(),
      location: location.trim() || 'Localizaçío nío informada',
      neighborhood: location.trim() || 'Local nío informado',
      image: images[0] ?? null,
      images,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      textOnly: images.length === 0,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: null,
        verified: currentUser.verified,
        type: currentUser.type,
      },
      likes: 0,
      comments: 0,
      shares: 0,
      urgent,
      createdAt: 'agora',
      contact: contact.trim(),
      tags: healthTags,
    };

    try {
      await addPost(newPost);
      router.back();
    } catch {
      Alert.alert('Erro ao publicar', 'Nío foi possível publicar agora. Tente novamente.');
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
      {/* ── HEADER ── */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn} activeOpacity={0.7}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nova publicaçío</Text>
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
        {/* ── POST TYPE SELECTOR ── */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Qual é a situaçío?
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

        {/* ── AUTHOR CARD ── */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.authorRow}>
            <View style={[styles.avatarCircle, { backgroundColor: currentType.color }]}>
              <Text style={styles.avatarInitial}>{displayName[0]?.toUpperCase() ?? 'V'}</Text>
            </View>
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: colors.foreground }]}>{displayName}</Text>
                {user?.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#2F80ED15' }]}>
                    <MaterialCommunityIcons name="check-circle" size={10} color="#2F80ED" />
                    <Text style={styles.verifiedText}>Verificado</Text>
                  </View>
                )}
              </View>
              <View style={styles.authorMeta}>
                <View style={[styles.roleBadge, { backgroundColor: currentType.light }]}>
                  <Text style={[styles.roleText, { color: currentType.color }]}>
                    {user?.type === 'ong' ? '🏅 ONG' : user?.type === 'vet' ? '🩺 Veterinário' : ' Protetor(a)'}
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

        {/* ── COMPOSER ── */}
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

        {/* ── ANIMAL TYPE + HEALTH TAGS — oculto para posts de texto ── */}
        {selectedType !== 'post' && (
          <>
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

            <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Características</Text>
              <View style={styles.tagGrid}>
                {HEALTH_TAGS.map((tag) => {
                  const isOn = healthTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.healthTag,
                        {
                          backgroundColor: isOn ? currentType.color : colors.muted,
                          borderColor: isOn ? currentType.color : 'transparent',
                        },
                      ]}
                      onPress={() => toggleHealthTag(tag)}
                      activeOpacity={0.8}
                    >
                      {isOn && <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />}
                      <Text style={[styles.healthTagText, { color: isOn ? '#FFFFFF' : colors.mutedForeground }]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── MEDIA SECTION ── */}
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

        {/* ── LOCATION ── */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Localizaçío</Text>
          <View style={[styles.locationInput, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={currentType.color} />
            <TextInput
              style={[styles.locationText, { color: colors.foreground }]}
              placeholder="Bairro, cidade, estado..."
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />
            {location.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setLocation('');
                  setCoords(null);
                  setMapImageUrl(null);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.mapPreview, { backgroundColor: colors.muted }]}>
            {mapImageUrl ? (
              <Image source={{ uri: mapImageUrl }} style={styles.mapPreviewImage} contentFit="cover" />
            ) : (
              <MaterialCommunityIcons name="map-outline" size={22} color={colors.mutedForeground} />
            )}
            <Text style={[styles.mapPreviewText, { color: colors.mutedForeground }]}>
              {location.trim() ? location : 'Nenhuma localizaçío definida'}
            </Text>
            <TouchableOpacity
              style={[styles.autoLocBtn, { backgroundColor: currentType.color }]}
              onPress={detectLocation}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="navigation-variant" size={12} color="#FFFFFF" />
              <Text style={styles.autoLocText}>Detectar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Contato</Text>
          <View style={[styles.locationInput, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={currentType.color} />
            <TextInput
              style={[styles.locationText, { color: colors.foreground }]}
              placeholder="WhatsApp ou telefone (opcional)"
              placeholderTextColor={colors.mutedForeground}
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ── URGENCY ── */}
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

        {/* ── TRUST SYSTEM ── */}
        <View style={[styles.section, styles.trustCard, { backgroundColor: '#2F80ED08', borderColor: '#2F80ED30' }]}>
          <View style={styles.trustHeader}>
            <MaterialCommunityIcons name="shield-outline" size={16} color="#2F80ED" />
            <Text style={[styles.trustTitle, { color: '#2F80ED' }]}>Sistema de confiança ZooHelp</Text>
          </View>
          {[
            { icon: 'account-check' as MCIcon,  text: 'Sua identidade é verificada pela plataforma' },
            { icon: 'eye-outline' as MCIcon,    text: 'Denúncias sío monitoradas em tempo real' },
            { icon: 'lock-outline' as MCIcon,   text: 'Doações com rastreabilidade total' },
          ].map((item) => (
            <View key={item.text} style={styles.trustRow}>
              <MaterialCommunityIcons name={item.icon} size={13} color="#2F80ED" />
              <Text style={[styles.trustText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── BOTTOM DOCK ── */}
      <View
        style={[
          styles.dock,
          { borderTopColor: colors.border, paddingBottom: bottomPad + 6 },
        ]}
      >
        <View style={styles.dockIcons}>
          {[
  { icon: 'image-outline' as MCIcon, color: '#2D6A4F', label: 'Foto', onPress: pickImage },
  { icon: 'microphone-outline' as MCIcon, color: '#2C5F8A', label: 'Áudio', onPress: () => Alert.alert('Áudio', 'Upload de áudio será liberado junto com moderaçío de mídia.') },
  { icon: 'map-marker-outline' as MCIcon, color: '#D4A259', label: 'Local', onPress: detectLocation },
  { icon: 'tag-outline' as MCIcon, color: '#6B5B8A', label: 'Tag', onPress: () => Alert.alert('Tags', 'Selecione características na seçío acima.') },
  { icon: 'dots-horizontal' as MCIcon, color: '#6B7B6B', label: 'Mais', onPress: () => Alert.alert('Mais opções', 'Recursos avançados serío ativados conforme moderaçío e backend evoluírem.') },
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
  cancelText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 5 },
  headerTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
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
  publishTopText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

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
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  /* type pills */
  typeRow: { gap: 6, paddingBottom: 2 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  typePillEmoji: { fontSize: 12 },
  typePillLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  /* author */
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarInitial: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  authorInfo: { flex: 1, gap: 3 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7,
  },
  verifiedText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#2F80ED' },
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
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 25,
    minHeight: 100,
    paddingTop: 0,
  },
  composerFooter: { alignItems: 'flex-end' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  /* animal */
  animalGrid: { flexDirection: 'row', gap: 10 },
  animalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  animalEmoji: { fontSize: 26 },
  animalLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

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
  publishText: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.1 },
});
