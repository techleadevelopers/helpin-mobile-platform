import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import { useApp } from '@/context/AppContext';
import { createZooHelpApi, uploadLocalImageToCloudinary } from '@/services/zoohelpApi';

type KybDocumentType = 'document_front' | 'document_back' | 'selfie_with_document';
type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DOCUMENTS: Array<{
  type: KybDocumentType;
  title: string;
  caption: string;
  icon: MCIcon;
}> = [
  {
    type: 'document_front',
    title: 'RG - frente',
    caption: 'Foto frontal do documento',
    icon: 'card-account-details-outline',
  },
  {
    type: 'document_back',
    title: 'RG - verso',
    caption: 'Foto do verso do documento',
    icon: 'card-account-details-star-outline',
  },
  {
    type: 'selfie_with_document',
    title: 'Selfie com RG',
    caption: 'Foto segurando o documento',
    icon: 'face-recognition',
  },
];

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, refreshUser } = useApp();
  const [photos, setPhotos] = useState<Record<KybDocumentType, string | null>>({
    document_front: null,
    document_back: null,
    selfie_with_document: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedCount = useMemo(
    () => DOCUMENTS.filter((document) => Boolean(photos[document.type])).length,
    [photos],
  );
  const allSelected = selectedCount === DOCUMENTS.length;
  const bottomPad = Platform.OS === 'web' ? 28 : Math.max(insets.bottom, 16);

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.type !== 'ong') return <Redirect href="/(tabs)/profile" />;

  async function captureDocument(type: KybDocumentType) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera necessaria', 'Autorize a camera para fotografar o documento.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.86,
    });
    const uri = !result.canceled ? result.assets[0]?.uri : null;
    if (!uri) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPhotos((current) => ({ ...current, [type]: uri }));
    setSubmitted(false);
  }

  async function submitVerification() {
    if (!allSelected) {
      Alert.alert('Fotos pendentes', 'Envie frente, verso e selfie com RG.');
      return;
    }

    const api = createZooHelpApi();
    if (!api) {
      Alert.alert('Servico indisponivel', 'Nao foi possivel conectar ao envio agora.');
      return;
    }

    setSubmitting(true);
    try {
      for (const document of DOCUMENTS) {
        const uri = photos[document.type];
        if (!uri) continue;
        const uploaded = await uploadLocalImageToCloudinary(api, uri, 'kyb-document');
        await api.createMyKybDocument({
          documentType: document.type,
          objectKey: uploaded.objectKey,
          publicUrl: uploaded.publicUrl,
        });
      }
      await refreshUser().catch(() => undefined);
      setSubmitted(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Documentos enviados', 'Seu envio foi encaminhado para analise administrativa.');
    } catch (error) {
      console.error('[verification] failed to submit KYB documents', error);
      Alert.alert('Falha no envio', 'Nao foi possivel enviar os documentos. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ZooHelpHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 18 }]}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons name="shield-account-outline" size={22} color="#2D6A4F" />
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.eyebrow}>Conta ONG</Text>
            <Text style={styles.title}>Verificação de conta</Text>
            <Text style={styles.subtitle}>Validação documental para o selo ZooHelp</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialCommunityIcons
              name={submitted ? 'check-decagram-outline' : 'shield-star-outline'}
              size={18}
              color="#2D6A4F"
            />
            <Text style={styles.statusTitle}>
              {submitted ? 'Documentos enviados' : 'Analise de identidade'}
            </Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{selectedCount}/3</Text>
            </View>
          </View>
          <Text style={styles.statusText}>
            {submitted
              ? 'O painel administrativo recebeu as imagens para revisao.'
              : 'As fotos ficam vinculadas a conta da ONG para revisao administrativa.'}
          </Text>
        </View>

        <View style={styles.documentList}>
          {DOCUMENTS.map((document) => {
            const uri = photos[document.type];
            return (
              <TouchableOpacity
                key={document.type}
                style={[styles.documentCard, uri && styles.documentCardSelected]}
                activeOpacity={0.82}
                onPress={() => captureDocument(document.type)}
                disabled={submitting}
              >
                {uri ? (
                  <Image source={{ uri }} style={styles.preview} contentFit="cover" />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <MaterialCommunityIcons name={document.icon} size={25} color="#2D6A4F" />
                  </View>
                )}
                <View style={styles.documentCopy}>
                  <Text style={styles.documentTitle}>{document.title}</Text>
                  <Text style={styles.documentCaption}>{document.caption}</Text>
                </View>
                <View style={[styles.cameraBtn, uri && styles.cameraBtnSelected]}>
                  <MaterialCommunityIcons name={uri ? 'camera-retake-outline' : 'camera-plus-outline'} size={18} color="#2D6A4F" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.privacyLine}>
          <MaterialCommunityIcons name="lock-outline" size={14} color="#718175" />
          <Text style={styles.privacyText}>Arquivos enviados com acesso restrito a analise administrativa.</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!allSelected || submitting) && styles.submitBtnDisabled]}
          onPress={submitVerification}
          activeOpacity={0.86}
          disabled={!allSelected || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitText}>{submitting ? 'Enviando documentos...' : 'Enviar para analise'}</Text>
        </TouchableOpacity>

        {submitted && (
          <TouchableOpacity style={styles.returnBtn} activeOpacity={0.82} onPress={() => router.back()}>
            <Text style={styles.returnText}>Voltar ao perfil</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8F4',
  },
  content: {
    padding: 18,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10,
    color: '#2D6A4F',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 19,
    color: '#18231B',
  },
  subtitle: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    color: '#7C867C',
  },
  statusCard: {
    padding: 14,
    gap: 9,
    borderRadius: 18,
    backgroundColor: '#EAF3EC',
    borderWidth: 1,
    borderColor: '#D7E9DA',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    flex: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#18231B',
  },
  progressPill: {
    minWidth: 40,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 10,
    color: '#2D6A4F',
  },
  statusText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    lineHeight: 16,
    color: '#607164',
  },
  documentList: {
    gap: 10,
  },
  documentCard: {
    minHeight: 82,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    shadowColor: '#172018',
    shadowOpacity: 0.045,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  documentCardSelected: {
    borderColor: '#CFE0D4',
    backgroundColor: '#FFFFFF',
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 13,
    backgroundColor: '#EAF3EC',
  },
  previewPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF7EF',
  },
  documentCopy: {
    flex: 1,
    gap: 4,
  },
  documentTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#18231B',
  },
  documentCaption: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    color: '#7C867C',
  },
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F3',
  },
  cameraBtnSelected: {
    backgroundColor: '#EAF3EC',
  },
  privacyLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 3,
    paddingTop: 2,
  },
  privacyText: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    lineHeight: 15,
    color: '#718175',
  },
  submitBtn: {
    height: 52,
    marginTop: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    shadowColor: '#2D6A4F',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 14,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#AAB9AE',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  returnBtn: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE5',
  },
  returnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    color: '#2D6A4F',
  },
});
