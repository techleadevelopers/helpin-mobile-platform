import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

import { MOCK_AUTHORS, Post, PostType, POST_TYPE_CONFIG } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

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
  { type: 'post',      icon: 'pencil-outline', label: 'Escrever',   color: '#6E6E73', light: '#6E6E7315', cta: 'Publicar post' },
  { type: 'adoption',  icon: 'home-heart',     label: 'Adoção',     color: '#4CAF50', light: '#4CAF5015', cta: 'Publicar para adoção' },
  { type: 'lost',      icon: 'magnify',        label: 'Perdido',    color: '#FF9800', light: '#FF980015', cta: 'Reportar animal perdido' },
  { type: 'found',     icon: 'check-circle',   label: 'Encontrado', color: '#2F80ED', light: '#2F80ED15', cta: 'Reportar animal encontrado' },
  { type: 'emergency', icon: 'alert-circle',   label: 'Emergência', color: '#FF3B30', light: '#FF3B3015', cta: 'Pedir ajuda urgente' },
  { type: 'campaign',  icon: 'heart-multiple', label: 'Campanha',   color: '#9B59B6', light: '#9B59B615', cta: 'Lançar campanha' },
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
  const { addPost, user } = useApp();

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<PostType>('adoption');
  const [animalType, setAnimalType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [healthTags, setHealthTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const inputBorder = useSharedValue(0);
  const urgentPulse = useSharedValue(1);

  const topPad = Platform.OS === 'web' ? 44 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom;

  const currentType = POST_TYPES.find((t) => t.type === selectedType)!;
  const canPost = text.trim().length > 0 || images.length > 0;
  const displayName = user?.name ?? 'Você';

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

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((u) => u !== uri));
  }

  async function handlePublish() {
    if (!canPost) {
      Alert.alert('Publicação vazia', 'Escreva algo ou adicione uma foto.');
      return;
    }
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
      location: location.trim() || 'Localização não informada',
      neighborhood: location.trim() || 'Local não informado',
      image: images[0] ?? null,
      textOnly: images.length === 0,
      author: user
        ? { id: user.id, name: user.name, avatar: null, verified: user.verified, type: user.type }
        : MOCK_AUTHORS[4],
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
      Alert.alert('Erro ao publicar', 'Não foi possível publicar agora. Tente novamente.');
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
        {/* ── POST TYPE SELECTOR ── */}
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
                    {user?.type === 'ong' ? '🏅 ONG' : user?.type === 'vet' ? '🩺 Veterinário' : '🛡️ Protetor(a)'}
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Localização</Text>
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
              <TouchableOpacity onPress={() => setLocation('')}>
                <MaterialCommunityIcons name="close-circle" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.mapPreview, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name="map-outline" size={22} color={colors.mutedForeground} />
            <Text style={[styles.mapPreviewText, { color: colors.mutedForeground }]}>
              {location.trim() ? location : 'Nenhuma localização definida'}
            </Text>
            <TouchableOpacity
              style={[styles.autoLocBtn, { backgroundColor: currentType.color }]}
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
                backgroundColor: urgent ? '#FF3B3008' : '#FFFFFF',
                borderColor: urgent ? '#FF3B30' : colors.border,
              },
            ]}
            onPress={toggleUrgent}
            activeOpacity={0.92}
          >
            <View style={[styles.urgentIcon, { backgroundColor: urgent ? '#FF3B30' : colors.muted }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={22} color={urgent ? '#FFFFFF' : colors.mutedForeground} />
            </View>
            <View style={styles.urgentInfo}>
              <Text style={[styles.urgentTitle, { color: urgent ? '#FF3B30' : colors.foreground }]}>
                Marcar como URGENTE
              </Text>
              <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
                Aparece em destaque no feed e notifica usuários próximos
              </Text>
            </View>
            <View style={[styles.toggleTrack, { backgroundColor: urgent ? '#FF3B30' : colors.muted }]}>
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

      {/* ── BOTTOM DOCK ── */}
      <View
        style={[
          styles.dock,
          { borderTopColor: colors.border, paddingBottom: bottomPad + 6 },
        ]}
      >
        <View style={styles.dockIcons}>
          {[
            { icon: 'image-outline'       as MCIcon, color: '#4CAF50', label: 'Foto',  onPress: pickImage },
            { icon: 'microphone-outline'  as MCIcon, color: '#2F80ED', label: 'Áudio', onPress: () => {} },
            { icon: 'map-marker-outline'  as MCIcon, color: '#FF9800', label: 'Local', onPress: () => {} },
            { icon: 'tag-outline'         as MCIcon, color: '#9B59B6', label: 'Tag',   onPress: () => {} },
            { icon: 'dots-horizontal'     as MCIcon, color: '#6E6E73', label: 'Mais',  onPress: () => {} },
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
  cancelBtn: { paddingVertical: 6, paddingRight: 4 },
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
    paddingHorizontal: 18,
    paddingVertical: 8,
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
  },
  mapPreviewText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  autoLocBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
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
