import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOCK_AUTHORS, Post, PostType } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const POST_TYPES: Array<{ type: PostType; label: string; icon: MCIcon; color: string }> = [
  { type: 'adoption',  label: 'Adoção',     icon: 'home-heart',    color: '#4CAF50' },
  { type: 'lost',      label: 'Perdido',    icon: 'magnify',       color: '#FF9800' },
  { type: 'found',     label: 'Encontrado', icon: 'check-circle',  color: '#2F80ED' },
  { type: 'emergency', label: 'Emergência', icon: 'alert-circle',  color: '#FF3B30' },
  { type: 'campaign',  label: 'Campanha',   icon: 'heart-multiple',color: '#9B59B6' },
];

const ANIMAL_TYPES: Array<{ value: 'dog' | 'cat' | 'other'; label: string; icon: MCIcon }> = [
  { value: 'dog',   label: 'Cachorro', icon: 'dog' },
  { value: 'cat',   label: 'Gato',     icon: 'cat' },
  { value: 'other', label: 'Outro',    icon: 'paw' },
];

export default function PublishScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addPost, user } = useApp();

  const [selectedType, setSelectedType] = useState<PostType>('adoption');
  const [animalType, setAnimalType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha nome, descrição e localização.');
      return;
    }
    setSubmitting(true);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: selectedType,
      animalType,
      name: name.trim(),
      breed: breed.trim() || 'Raça nío informada',
      age: age.trim() || 'Idade desconhecida',
      description: description.trim(),
      location: location.trim(),
      neighborhood: location.trim(),
      image: imageUri,
      textOnly: !imageUri,
      author: user
        ? { id: user.id, name: user.name, avatar: null, verified: user.verified, type: user.type }
        : MOCK_AUTHORS[0],
      likes: 0,
      comments: 0,
      shares: 0,
      urgent,
      createdAt: 'agora',
      contact: contact.trim() || '',
      tags: [],
    };

    try {
      await addPost(newPost);

      Alert.alert('Publicado!', 'Seu caso foi publicado com sucesso.', [
        { text: 'Ver no feed', onPress: () => router.push('/(tabs)') },
      ]);

      setName('');
      setBreed('');
      setAge('');
      setDescription('');
      setLocation('');
      setContact('');
      setUrgent(false);
      setImageUri(null);
    } catch {
      Alert.alert('Erro ao publicar', 'Nío foi possível publicar agora. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTypeConfig = POST_TYPES.find((t) => t.type === selectedType)!;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Publicar caso</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Ajude animais que precisam de você
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Tipo de caso</Text>
      <View style={styles.typeGrid}>
        {POST_TYPES.map((t) => {
          const isActive = selectedType === t.type;
          return (
            <TouchableOpacity
              key={t.type}
              style={[
                styles.typeCard,
                {
                  backgroundColor: isActive ? t.color : colors.card,
                  borderColor: isActive ? t.color : colors.border,
                  shadowColor: isActive ? t.color : colors.shadow,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setSelectedType(t.type)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={t.icon}
                size={20}
                color={isActive ? '#FFFFFF' : t.color}
              />
              <Text style={[styles.typeLabel, { color: isActive ? '#FFFFFF' : colors.foreground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Animal</Text>
      <View style={styles.animalRow}>
        {ANIMAL_TYPES.map((a) => {
          const isActive = animalType === a.value;
          return (
            <TouchableOpacity
              key={a.value}
              style={[
                styles.animalChip,
                {
                  backgroundColor: isActive ? colors.primary + '18' : colors.muted,
                  borderColor: isActive ? colors.primary + '50' : 'transparent',
                  shadowColor: isActive ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setAnimalType(a.value)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={a.icon}
                size={16}
                color={isActive ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.animalText, { color: isActive ? colors.primary : colors.mutedForeground }]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.imagePickerBtn,
          {
            backgroundColor: imageUri ? 'transparent' : colors.muted,
            borderColor: colors.border,
            borderWidth: imageUri ? 0 : 2,
            borderStyle: 'dashed',
          },
        ]}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <View style={styles.imagePickerContent}>
            <View
              style={[
                styles.cameraIconBg,
                {
                  backgroundColor: '#4CAF5014',
                  borderColor: '#4CAF5040',
                  shadowColor: '#4CAF50',
                },
              ]}
            >
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#4CAF50" />
            </View>
            <Text style={[styles.imagePickerText, { color: colors.foreground }]}>Adicionar foto</Text>
            <Text style={[styles.imagePickerHint, { color: colors.mutedForeground }]}>
              Fotos aumentam muito as chances de ajuda
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Informações</Text>

      {[
        { label: 'Nome do animal *', value: name, setter: setName, placeholder: 'Ex: Mel, Thor, Desconhecido' },
        { label: 'Raça', value: breed, setter: setBreed, placeholder: 'Ex: Vira-lata, Golden Retriever' },
        { label: 'Idade', value: age, setter: setAge, placeholder: 'Ex: 2 anos, Filhote, Adulto' },
        { label: 'Localização *', value: location, setter: setLocation, placeholder: 'Bairro, Cidade, Estado' },
        { label: 'Contato', value: contact, setter: setContact, placeholder: 'WhatsApp ou telefone' },
      ].map((field) => (
        <View key={field.label}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={field.value}
              onChangeText={field.setter}
            />
          </View>
        </View>
      ))}

      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descrição *</Text>
      <View
        style={[
          styles.inputWrapper,
          styles.textAreaWrapper,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, styles.textArea, { color: colors.foreground }]}
          placeholder="Descreva a situação, temperamento do animal, necessidades especiais..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.urgentToggle,
          {
            backgroundColor: urgent ? '#FF3B3010' : colors.muted,
            borderColor: urgent ? '#FF3B30' : colors.border,
            shadowColor: urgent ? '#FF3B30' : 'transparent',
          },
        ]}
        onPress={() => setUrgent(!urgent)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={20}
          color={urgent ? '#FF3B30' : colors.mutedForeground}
        />
        <Text style={[styles.urgentText, { color: urgent ? '#FF3B30' : colors.foreground }]}>
          Marcar como URGENTE
        </Text>
        <View style={[styles.toggle, { backgroundColor: urgent ? '#FF3B30' : colors.muted }]}>
          {urgent && <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: submitting ? colors.muted : selectedTypeConfig.color,
            shadowColor: submitting ? 'transparent' : selectedTypeConfig.color,
          },
        ]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
        <Text style={styles.submitBtnText}>
          {submitting ? 'Publicando...' : 'Publicar caso'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -6 },
  sectionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  typeLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  animalRow: { flexDirection: 'row', gap: 8 },
  animalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  animalText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  imagePickerBtn: {
    height: 165,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerContent: { alignItems: 'center', gap: 8 },
  cameraIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePickerText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  imagePickerHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  previewImage: { width: '100%', height: '100%' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: -6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  textAreaWrapper: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 90 },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  urgentText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  toggle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
});
