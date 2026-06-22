import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { createZooHelpApi, uploadLocalImageToCloudinary } from '@/services/zoohelpApi';

type AccountType = 'person' | 'ong';
type KybDocumentType = 'document_front' | 'document_back' | 'selfie_with_document';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ZOOHELP_REGISTER_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

const ONG_TYPES = [
  { value: 'rescue', label: 'Resgate animal', hint: 'Emergencias, captura e acolhimento', icon: 'lifebuoy' as MCIcon },
  { value: 'adoption', label: 'Adoção responsavel', hint: 'Lar temporario, triagem e adoção', icon: 'heart-outline' as MCIcon },
  { value: 'vet', label: 'Veterinária', icon: 'medical-bag' as MCIcon },
  { value: 'hospital', label: 'Hospital parceiro', hint: 'Internação, exames e suporte medico', icon: 'hospital-building' as MCIcon },
  { value: 'welfare', label: 'Proteção e bem-estar', hint: 'Denuncias, orientação e prevenção', icon: 'shield-heart-outline' as MCIcon },
];

const KYB_DOCUMENTS: Array<{ type: KybDocumentType; label: string; icon: MCIcon }> = [
  { type: 'document_front', label: 'Frente do RG', icon: 'card-account-details-outline' },
  { type: 'document_back', label: 'Verso do RG', icon: 'card-account-details-star-outline' },
  { type: 'selfie_with_document', label: 'Foto com RG na mao', icon: 'face-man-profile' },
];

function totalSteps(type: AccountType | null) {
  if (!type) return 1;
  return type === 'person' ? 3 : 6;
}

export default function RegisterScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useApp();

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Personal fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ONG-specific fields
  const [ongName, setOngName] = useState('');
  const [ongType, setOngType] = useState('');
  const [showOngTypeOptions, setShowOngTypeOptions] = useState(false);
  const [ongCnpj, setOngCnpj] = useState('');
  const [ongFoundationYear, setOngFoundationYear] = useState('');
  const [ongEmail, setOngEmail] = useState('');
  const [ongPhone, setOngPhone] = useState('');
  const [ongCep, setOngCep] = useState('');
  const [ongStreet, setOngStreet] = useState('');
  const [ongNumber, setOngNumber] = useState('');
  const [ongComplement, setOngComplement] = useState('');
  const [ongNeighborhood, setOngNeighborhood] = useState('');
  const [ongCity, setOngCity] = useState('');
  const [ongState, setOngState] = useState('');
  const [ongPassword, setOngPassword] = useState('');
  const [ongLogoUri, setOngLogoUri] = useState<string | null>(null);
  const [kybDocuments, setKybDocuments] = useState<Record<KybDocumentType, string | null>>({
    document_front: null,
    document_back: null,
    selfie_with_document: null,
  });
  const [showOngPassword, setShowOngPassword] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const lastCepLookupRef = useRef('');

  const topPad = Platform.OS === 'web' ? 24 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const total = totalSteps(accountType);

  function animateProgress(toStep: number) {
    Animated.timing(progressAnim, {
      toValue: toStep / (total - 1),
      duration: 320,
      useNativeDriver: false,
    }).start();
  }

  function animateSlide(direction: 1 | -1, callback: () => void) {
    slideAnim.setValue(direction * 40);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    callback();
  }

  function goNext(nextStep: number) {
    animateSlide(1, () => setStep(nextStep));
    animateProgress(nextStep);
  }

  function goBack() {
    if (step === 0) {
      router.back();
      return;
    }
    const prevStep = step - 1;
    if (prevStep === 0) setAccountType(null);
    animateSlide(-1, () => setStep(prevStep));
    animateProgress(prevStep);
  }

  function handleTermsPress() {
    if (acceptedTerms) {
      setAcceptedTerms(false);
      return;
    }

    Alert.alert(
      `${t('common.terms')} / ${t('common.privacy')}`,
      t('common.termsAgreement'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.continue'), onPress: () => setAcceptedTerms(true) },
      ],
    );
  }

  function validateAndNext() {
    if (step === 0) {
      if (!accountType) {
        Alert.alert(t('register.errSelectTypeTitle'), t('register.errSelectType'));
        return;
      }
      goNext(1);
      return;
    }

    if (accountType === 'person') {
      if (step === 1) {
        if (!name.trim()) { Alert.alert(t('register.errNameTitle'), t('register.errName')); return; }
        if (!email.trim() || !email.includes('@')) { Alert.alert(t('register.errEmailTitle'), t('register.errEmail')); return; }
        goNext(2);
      } else if (step === 2) {
        if (password.length < 8) { Alert.alert(t('register.errWeakPasswordTitle'), t('register.errWeakPassword')); return; }
        if (password !== confirmPassword) { Alert.alert(t('register.errMismatchTitle'), t('register.errMismatch')); return; }
        if (!acceptedTerms) { Alert.alert(t('common.terms'), t('common.termsAgreement')); return; }
        handleSubmit();
      }
      return;
    }

    if (accountType === 'ong') {
      if (step === 1) {
        if (!ongName.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome da ONG.'); return; }
        if (!ongType) { Alert.alert('Campo obrigatorio', 'Selecione o tipo de atuação.'); return; }
        if (ongFoundationYear.trim()) {
          const year = Number(ongFoundationYear);
          const currentYear = new Date().getFullYear();
          if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
            Alert.alert('Ano invalido', 'Informe um ano de fundação valido.');
            return;
          }
        }
        if (!gender) { Alert.alert('Campo obrigatorio', 'Informe como devemos tratar sua autoria.'); return; }
        goNext(2);
      } else if (step === 2) {
        if (!ongEmail.trim() || !ongEmail.includes('@')) { Alert.alert('E-mail inválido', 'Informe um e-mail válido.'); return; }
        if (!ongPhone.trim()) { Alert.alert('Campo obrigatório', 'Informe o telefone/WhatsApp.'); return; }
        goNext(3);
      } else if (step === 3) {
        if (ongCep.replace(/\D/g, '').length !== 8) { Alert.alert('CEP obrigatorio', 'Informe um CEP valido com 8 digitos.'); return; }
        if (!ongStreet.trim()) { Alert.alert('Rua obrigatoria', 'Informe a rua da ONG.'); return; }
        if (!ongNumber.trim()) { Alert.alert('Numero obrigatorio', 'Informe o numero da ONG.'); return; }
        if (!ongCity.trim()) { Alert.alert('Campo obrigatorio', 'Informe a cidade.'); return; }
        if (ongState.trim().length !== 2) { Alert.alert('UF obrigatoria', 'Informe a UF com 2 letras.'); return; }
        goNext(4);
      } else if (step === 4) {
        if (ongPassword.length < 8) { Alert.alert('Senha fraca', 'A senha deve ter pelo menos 8 caracteres.'); return; }
        if (!acceptedTerms) { Alert.alert('Termos de Uso', 'Aceite os Termos de Uso e a Politica de Privacidade para continuar.'); return; }
        goNext(5);
      } else if (step === 5) {
        if (KYB_DOCUMENTS.some((doc) => !kybDocuments[doc.type])) {
          Alert.alert('Verificação obrigatoria', 'Envie frente e verso do RG e uma foto com o documento na mao.');
          return;
        }
        handleSubmit();
      }
    }
  }

  async function handleSubmit() {
    setLoading(true);
    let ongAccountCreated = false;
    try {
      if (accountType === 'person') {
        await register(name.trim(), email.trim(), password, 'person', { gender });
      } else {
        const cnpjDigits = ongCnpj.replace(/\D/g, '');
        await register(ongName.trim(), ongEmail.trim(), ongPassword, 'ong', {
          ongType,
          ...(cnpjDigits.length === 14 ? { cnpj: ongCnpj } : {}),
          phone: ongPhone,
          cep: ongCep,
          street: ongStreet.trim(),
          number: ongNumber.trim(),
          complement: ongComplement.trim(),
          neighborhood: ongNeighborhood.trim(),
          city: ongCity,
          state: ongState,
          ...(ongFoundationYear.trim() ? { foundationYear: Number(ongFoundationYear) } : {}),
        });
        ongAccountCreated = true;
        const api = createZooHelpApi();
        if (!api) throw new Error('Backend API unavailable for ONG media upload');
        if (ongLogoUri) {
          const uploadedLogo = await uploadLocalImageToCloudinary(api, ongLogoUri, 'ong-logo');
          await api.updateAvatar({ avatarUrl: uploadedLogo.publicUrl });
        }
        for (const doc of KYB_DOCUMENTS) {
          const uri = kybDocuments[doc.type];
          if (!uri) continue;
          const uploaded = await uploadLocalImageToCloudinary(api, uri, 'kyb-document');
          await api.createMyKybDocument({
            documentType: doc.type,
            objectKey: uploaded.objectKey,
            publicUrl: uploaded.publicUrl,
          });
        }
      }
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[register] failed to complete registration flow', error);
      if (ongAccountCreated) {
        Alert.alert(
          'Conta criada',
          'Nao foi possivel concluir o envio dos arquivos agora. Reenvie os documentos na tela de verificação.',
        );
        router.replace('/verification');
      } else {
        Alert.alert('Erro', 'Nao foi possivel criar a conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function pickOngLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setOngLogoUri(result.assets[0].uri);
    }
  }

  async function pickKybDocument(type: KybDocumentType) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const result = permission.granted
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.78,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.78,
        });
    if (!result.canceled && result.assets[0]?.uri) {
      setKybDocuments((prev) => ({ ...prev, [type]: result.assets[0].uri }));
    }
  }

  function formatPhone(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function formatCep(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  async function lookupCep(nextCep = ongCep) {
    const digits = nextCep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    if (lastCepLookupRef.current === digits && ongCity && ongState) return;
    lastCepLookupRef.current = digits;
    setCepLoading(true);
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
      setOngStreet(payload.logradouro ?? '');
      setOngNeighborhood(payload.bairro ?? '');
      setOngCity(payload.localidade ?? '');
      setOngState((payload.uf ?? '').toUpperCase());
    } catch {
      Alert.alert('CEP indisponivel', 'Nao foi possivel consultar o CEP agora. Preencha cidade e UF manualmente.');
    } finally {
      setCepLoading(false);
    }
  }

  function formatCnpj(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  const cnpjComplete = ongCnpj.replace(/\D/g, '').length === 14;
  const selectedOngType = ONG_TYPES.find((item) => item.value === ongType);

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f2f1' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: topPad + 12, paddingBottom: bottomPad + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#1A1A2E" />
            </TouchableOpacity>
            {step > 0 ? (
              <Text style={styles.stepCounter}>{step} de {total - 1}</Text>
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>

          {/* ── Progress bar ── */}
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

            {/* ══════════════════════════════════
                STEP 0 — Tipo de conta
            ══════════════════════════════════ */}
            {step === 0 && (
  <View style={[styles.section, styles.accountTypeSection]}>
    <View style={[styles.headingBlock, styles.accountTypeHeading]}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Selecione o tipo de perfil que melhor representa você</Text>
    </View>

    <View style={styles.accountTypePanel}>
    <View style={styles.typeCards}>
      <TouchableOpacity
        style={[
          styles.typeCard,
          accountType === 'person' && styles.typeCardActive,
        ]}
        onPress={() => setAccountType('person')}
        activeOpacity={0.85}
      >
        <View style={[
          styles.typeIconWrap,
          accountType === 'person' && styles.typeIconWrapActive,
        ]}>
          <MaterialCommunityIcons
            name="account-heart-outline"
            size={22}
            color={accountType === 'person' ? '#FFFFFF' : '#606864'}
          />
        </View>
        <View style={styles.typeContent}>
          <Text style={[
            styles.typeTitle,
            accountType === 'person' && styles.typeTitleActive,
          ]}>Conta Pessoal</Text>
          <Text style={styles.typeDesc}>
            Adotante, protetor independente ou voluntário
          </Text>
        </View>
        {accountType === 'person' && (
          <View style={styles.typeCheck}>
            <MaterialCommunityIcons name="check-circle" size={21} color="#606864" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeCard,
          accountType === 'ong' && styles.typeCardActive,
        ]}
        onPress={() => setAccountType('ong')}
        activeOpacity={0.85}
      >
        <View style={[
          styles.typeIconWrap,
          accountType === 'ong' && styles.typeIconWrapActive,
        ]}>
          <MaterialCommunityIcons
            name="hand-heart-outline"
            size={22}
            color={accountType === 'ong' ? '#FFFFFF' : '#606864'}
          />
        </View>
        <View style={styles.typeContent}>
          <Text style={[
            styles.typeTitle,
            accountType === 'ong' && styles.typeTitleActive,
          ]}>ONG / Protetor</Text>
          <Text style={styles.typeDesc}>
            Organização de resgate, adoção ou clínica veterinária
          </Text>
        </View>
        {accountType === 'ong' && (
          <View style={styles.typeCheck}>
            <MaterialCommunityIcons name="check-circle" size={21} color="#606864" />
          </View>
        )}
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={[
        styles.primaryBtn,
        accountType ? styles.primaryBtnActive : styles.primaryBtnDisabled,
      ]}
      onPress={validateAndNext}
      activeOpacity={0.88}
      disabled={!accountType}
    >
      <Text style={styles.primaryBtnText}>Continuar</Text>
    </TouchableOpacity>
    </View>

    <View style={styles.bottomBrand}>
      <Image source={{ uri: ZOOHELP_REGISTER_LOGO }} style={styles.bottomBrandLogo} contentFit="contain" />
      <Text style={styles.bottomBrandText}>Helpin</Text>
    </View>
  </View>
)}

            {/* ══════════════════════════════════
                PESSOA — Step 1: Nome + Email
            ══════════════════════════════════ */}
            {accountType === 'person' && step === 1 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Olá!</Text>
                  <Text style={styles.subtitle}>Como podemos te chamar?</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nome completo</Text>
                    <View style={[styles.inputRow, { borderColor: name ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="account-outline" size={20} color={name ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Seu nome completo"
                        placeholderTextColor="#A0AEC0"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <View style={[styles.inputRow, { borderColor: email ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={email ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="seu@email.com"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                PESSOA — Step 2: Senha
            ══════════════════════════════════ */}
            {accountType === 'person' && step === 2 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Quase lá!</Text>
                  <Text style={styles.subtitle}>Crie uma senha segura para sua conta</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Senha</Text>
                    <View style={[styles.inputRow, { borderColor: password.length >= 8 ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={password.length >= 8 ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Minimo 8 caracteres"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A0AEC0" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirmar senha</Text>
                    <View style={[styles.inputRow, { borderColor: confirmPassword && confirmPassword === password ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="lock-check-outline" size={20} color={confirmPassword && confirmPassword === password ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Repita a senha"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A0AEC0" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <StrengthBar password={password} />
                </View>

                <Text style={styles.terms}>
                  Ao criar sua conta você concorda com os{' '}
                  <Text style={{ color: '#2D6A4F', fontFamily: 'Inter_500Medium' }}>Termos de Uso</Text>
                  {' '}e{' '}
                  <Text style={{ color: '#2D6A4F', fontFamily: 'Inter_500Medium' }}>Política de Privacidade</Text>
                </Text>

                <TouchableOpacity style={styles.termsRow} onPress={handleTermsPress} activeOpacity={0.78}>
                  <View style={[styles.termsCheckbox, acceptedTerms && styles.termsCheckboxChecked]}>
                    {acceptedTerms && <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.termsText}>Aceito os Termos de Uso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !acceptedTerms) && styles.buttonDisabled]}
                  onPress={validateAndNext}
                  disabled={loading || !acceptedTerms}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Criando conta...' : 'Criar conta'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 1: Nome + Tipo
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 1 && (
              <View style={[styles.section, styles.ongProfileSection]}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Sua ONG</Text>
                  <Text style={styles.subtitle}>Qual e o nome e o foco de atuação?</Text>
                </View>

                <View style={[styles.fields, styles.ongStepPanel, styles.ongProfilePanel]}>
                  <TouchableOpacity style={styles.logoPickerRow} onPress={pickOngLogo} activeOpacity={0.82}>
                    <View style={styles.logoPickerPreview}>
                      {ongLogoUri ? (
                        <Image source={{ uri: ongLogoUri }} style={styles.logoPreviewImage} contentFit="cover" />
                      ) : (
                        <MaterialCommunityIcons name="camera-plus-outline" size={24} color="#00BCD4" />
                      )}
                      <View style={styles.logoPickerBadge}>
                        <MaterialCommunityIcons name="plus" size={13} color="#FFFFFF" />
                      </View>
                    </View>
                    <View style={styles.logoPickerTextWrap}>
                      <Text style={styles.logoPickerTitle}>Logo da ONG</Text>
                      <Text style={styles.logoPickerHint}>
                        {ongLogoUri ? 'Logo selecionada para upload' : 'Adicionar foto ou marca da ONG'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nome da ONG / Organização</Text>
                    <View style={[styles.inputRow, styles.ongInputRow, { borderColor: ongName ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="home-heart" size={20} color={ongName ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Patinhas Felizes"
                        placeholderTextColor="#A0AEC0"
                        autoCapitalize="words"
                        value={ongName}
                        onChangeText={setOngName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Area de atuação</Text>
                    <TouchableOpacity
                      style={[styles.selectInput, styles.ongInputRow, showOngTypeOptions && styles.selectInputOpen]}
                      onPress={() => setShowOngTypeOptions((value) => !value)}
                      activeOpacity={0.82}
                    >
                      <MaterialCommunityIcons
                        name={selectedOngType?.icon ?? 'heart-outline'}
                        size={20}
                        color={selectedOngType ? '#606864' : '#A0AEC0'}
                        style={styles.inputLeadingIcon}
                      />
                      <View style={styles.selectTextWrap}>
                        <Text style={[styles.selectValue, !selectedOngType && styles.selectPlaceholder]}>
                          {selectedOngType?.label ?? 'Selecione a area principal'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={showOngTypeOptions ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#606864"
                      />
                    </TouchableOpacity>

                    {showOngTypeOptions && (
                      <View style={styles.selectOptions}>
                        {ONG_TYPES.map((t) => {
                          const active = ongType === t.value;

                          return (
                            <TouchableOpacity
                              key={t.value}
                              style={[styles.selectOption, active && styles.selectOptionActive]}
                              onPress={() => {
                                setOngType(t.value);
                                setShowOngTypeOptions(false);
                              }}
                              activeOpacity={0.82}
                            >
                              <MaterialCommunityIcons name={t.icon} size={18} color={active ? '#606864' : '#8A94A6'} />
                              <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>{t.label}</Text>
                              {active && <MaterialCommunityIcons name="check" size={18} color="#606864" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.cnpjLabelRow}>
                      <Text style={styles.fieldLabel}>CNPJ</Text>
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalText}>opcional</Text>
                      </View>
                      {cnpjComplete && (
                        <View style={styles.verifiedPreview}>
                          <MaterialCommunityIcons name="shield-check" size={11} color="#2D6A4F" />
                          <Text style={styles.verifiedPreviewText}>Ganha selo Verificado</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputRow, styles.ongInputRow, { borderColor: cnpjComplete ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons
                        name="card-account-details-outline"
                        size={20}
                        color={cnpjComplete ? '#2D6A4F' : '#A0AEC0'}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="00.000.000/0000-00"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="numeric"
                        value={ongCnpj}
                        onChangeText={(t) => setOngCnpj(formatCnpj(t))}
                      />
                      {cnpjComplete && (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#2D6A4F" />
                      )}
                    </View>
                    <Text style={styles.cnpjHint}>
                      ONGs com CNPJ valido recebem o selo de verificação no perfil.
                    </Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Ano de fundação</Text>
                    <View style={[styles.inputRow, styles.ongInputRow, { borderColor: ongFoundationYear ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="calendar-heart" size={20} color={ongFoundationYear ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: 2018"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="numeric"
                        value={ongFoundationYear}
                        onChangeText={(text) => setOngFoundationYear(text.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Como devemos mostrar sua autoria?</Text>
                    <View style={styles.genderRow}>
                      {[
                        { value: 'male' as const, label: 'Autor', icon: 'account-outline' as MCIcon },
                        { value: 'female' as const, label: 'Autora', icon: 'account-heart-outline' as MCIcon },
                      ].map((item) => {
                        const active = gender === item.value;
                        return (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.genderOption, active && styles.genderOptionActive]}
                            onPress={() => setGender(item.value)}
                            activeOpacity={0.82}
                          >
                            <MaterialCommunityIcons name={item.icon} size={17} color={active ? '#2D6A4F' : '#8A928B'} />
                            <Text style={[styles.genderText, active && styles.genderTextActive]}>{item.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 2: Contato
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 2 && (
              <View style={[styles.section, styles.contactStepSection]}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Contato</Text>
                  <Text style={styles.subtitle}>Como adotantes e voluntários entram em contato?</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>E-mail oficial</Text>
                    <View style={[styles.inputRow, { borderColor: ongEmail ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={20}
                        color={ongEmail ? '#2D6A4F' : '#A0AEC0'}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="contato@suaong.org"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={ongEmail}
                        onChangeText={setOngEmail}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>WhatsApp / Telefone</Text>
                    <View style={[styles.inputRow, { borderColor: ongPhone ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons
                        name="whatsapp"
                        size={20}
                        color={ongPhone ? '#2D6A4F' : '#A0AEC0'}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="(00) 00000-0000"
                        placeholderTextColor="#A0AEC0"
                        keyboardType="phone-pad"
                        value={ongPhone}
                        onChangeText={(t) => setOngPhone(formatPhone(t))}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 3: Senha
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 3 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Endereco da ONG</Text>
                  <Text style={styles.subtitle}>Informe o CEP para preencher cidade e UF automaticamente</Text>
                </View>

                <View style={[styles.fields, styles.addressFields]}>
                  <View style={[styles.fieldGroup, styles.addressFieldGroup]}>
                    <Text style={styles.fieldLabel}>CEP</Text>
                    <View style={[styles.inputRow, styles.addressInputRow, { borderColor: ongCep.replace(/\D/g, '').length === 8 ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={ongCep.replace(/\D/g, '').length === 8 ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="00000-000"
                        placeholderTextColor="#A0AEC0"
                        value={ongCep}
                        onChangeText={(text) => {
                          const nextCep = formatCep(text);
                          setOngCep(nextCep);
                          if (nextCep.replace(/\D/g, '').length === 8) {
                            void lookupCep(nextCep);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={9}
                      />
                    </View>
                    {cepLoading && <Text style={styles.cepLoadingText}>Consultando CEP...</Text>}
                  </View>

                  <View style={[styles.fieldGroup, styles.addressFieldGroup]}>
                    <Text style={styles.fieldLabel}>Rua</Text>
                    <View style={[styles.inputRow, styles.addressInputRow, { borderColor: ongStreet ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="road-variant" size={20} color={ongStreet ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Rua / Avenida"
                        placeholderTextColor="#A0AEC0"
                        value={ongStreet}
                        onChangeText={setOngStreet}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={[styles.row, styles.addressRow]}>
                    <View style={[styles.fieldGroup, styles.addressFieldGroup, { width: 128 }]}>
                      <Text style={styles.fieldLabel}>Numero</Text>
                      <View style={[styles.inputRow, styles.addressInputRow, { borderColor: ongNumber ? '#2D6A4F' : '#E2E8F0' }]}>
                        <TextInput
                          style={styles.ufInput}
                          placeholder="No."
                          placeholderTextColor="#A0AEC0"
                          value={ongNumber}
                          onChangeText={setOngNumber}
                        />
                      </View>
                    </View>
                    <View style={[styles.fieldGroup, styles.addressFieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Bairro</Text>
                      <View style={[styles.inputRow, styles.addressInputRow, { borderColor: ongNeighborhood ? '#2D6A4F' : '#E2E8F0' }]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Bairro"
                          placeholderTextColor="#A0AEC0"
                          value={ongNeighborhood}
                          onChangeText={setOngNeighborhood}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, styles.addressFieldGroup]}>
                    <Text style={styles.fieldLabel}>Complemento</Text>
                    <View style={[styles.inputRow, styles.addressInputRow]}>
                      <MaterialCommunityIcons name="home-edit-outline" size={20} color="#A0AEC0" />
                      <TextInput
                        style={styles.input}
                        placeholder="Sala, casa, ponto de referencia"
                        placeholderTextColor="#A0AEC0"
                        value={ongComplement}
                        onChangeText={setOngComplement}
                      />
                    </View>
                  </View>

                  <View style={[styles.row, styles.addressRow]}>
                    <View style={[styles.fieldGroup, styles.addressFieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Cidade</Text>
                      <View style={[styles.inputRow, styles.addressInputRow]}>
                        <MaterialCommunityIcons name="city-variant-outline" size={20} color="#A0AEC0" />
                        <TextInput
                          style={styles.input}
                          placeholder="Cidade"
                          placeholderTextColor="#A0AEC0"
                          value={ongCity}
                          onChangeText={setOngCity}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                    <View style={[styles.fieldGroup, styles.addressFieldGroup, { width: 96 }]}>
                      <Text style={styles.fieldLabel}>UF</Text>
                      <View style={[styles.inputRow, styles.addressInputRow, styles.ufInputRow]}>
                        <TextInput
                          style={styles.ufInput}
                          placeholder="UF"
                          placeholderTextColor="#A0AEC0"
                          value={ongState}
                          onChangeText={(text) => setOngState(text.toUpperCase().slice(0, 2))}
                          autoCapitalize="characters"
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            )}

            {accountType === 'ong' && step === 4 && (
              <View style={[styles.section, styles.accessStepSection]}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Acesso seguro</Text>
                  <Text style={styles.subtitle}>Crie uma senha para acessar a conta da ONG</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Senha</Text>
                    <View style={[styles.inputRow, { borderColor: ongPassword.length >= 8 ? '#2D6A4F' : '#E2E8F0' }]}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color={ongPassword.length >= 8 ? '#2D6A4F' : '#A0AEC0'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Minimo 8 caracteres"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry={!showOngPassword}
                        value={ongPassword}
                        onChangeText={setOngPassword}
                      />
                      <TouchableOpacity onPress={() => setShowOngPassword(!showOngPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showOngPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#A0AEC0" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <StrengthBar password={ongPassword} color="#2D6A4F" />

                  <View style={[styles.ongBadge, { backgroundColor: 'rgba(45, 106, 79, 0.10)' }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={18} color="#2D6A4F" />
                    <Text style={[styles.ongBadgeText, { color: '#2D6A4F' }]}>
                      Sua ONG recebera um selo de verificação apos analise da equipe Helpin
                    </Text>
                  </View>
                </View>

                <Text style={styles.terms}>
                  Ao criar sua conta você concorda com os{' '}
                  <Text style={{ color: '#2D6A4F', fontFamily: 'Inter_500Medium' }}>Termos de Uso</Text>
                  {' '}e{' '}
                  <Text style={{ color: '#2D6A4F', fontFamily: 'Inter_500Medium' }}>Política de Privacidade</Text>
                </Text>

                <TouchableOpacity style={styles.termsRow} onPress={handleTermsPress} activeOpacity={0.78}>
                  <View style={[styles.termsCheckbox, acceptedTerms && styles.termsCheckboxChecked]}>
                    {acceptedTerms && <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.termsText}>Aceito os Termos de Uso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !acceptedTerms) && styles.buttonDisabled]}
                  onPress={validateAndNext}
                  disabled={loading || !acceptedTerms}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Criando conta...' : 'Cadastrar ONG'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {accountType === 'ong' && step === 5 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Validação da ONG</Text>
                  <Text style={styles.subtitle}>Envie os documentos do responsavel para analise da equipe Helpin</Text>
                </View>

                <View style={styles.fields}>
                  <View style={[styles.ongBadge, { backgroundColor: 'rgba(45, 106, 79, 0.10)' }]}>
                    <MaterialCommunityIcons name="shield-account-outline" size={18} color="#2D6A4F" />
                    <Text style={[styles.ongBadgeText, { color: '#2D6A4F' }]}>
                      Estes documentos sao solicitados apenas no cadastro de ONG e ficam sujeitos a revisao.
                    </Text>
                  </View>

                  <View style={styles.kybList}>
                    {KYB_DOCUMENTS.map((doc) => {
                      const selected = Boolean(kybDocuments[doc.type]);
                      return (
                        <TouchableOpacity
                          key={doc.type}
                          style={[styles.kybRow, selected && styles.kybRowComplete]}
                          onPress={() => pickKybDocument(doc.type)}
                          activeOpacity={0.82}
                        >
                          <View style={[styles.kybIconWrap, selected && styles.kybIconWrapComplete]}>
                            <MaterialCommunityIcons
                              name={selected ? 'check' : doc.icon}
                              size={20}
                              color={selected ? '#FFFFFF' : '#2D6A4F'}
                            />
                          </View>
                          <View style={styles.logoPickerTextWrap}>
                            <Text style={styles.logoPickerTitle}>{doc.label}</Text>
                            <Text style={styles.logoPickerHint}>{selected ? 'Imagem anexada' : 'Tocar para fotografar'}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.buttonDisabled]}
                  onPress={validateAndNext}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Enviando documentos...' : 'Finalizar cadastro'}</Text>
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StrengthBar({ password, color = '#2D6A4F' }: { password: string; color?: string }) {
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const labels = ['', 'Fraca', 'Boa', 'Forte'];
  const colors = ['', '#8E8E93', color, color];
  if (!password) return null;
  return (
    <View style={sbStyles.wrap}>
      <View style={sbStyles.bars}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[sbStyles.bar, { backgroundColor: strength >= i ? (strength === 1 ? '#D1D5DB' : color) : '#EDF2F7' }]}
          />
        ))}
      </View>
      <Text style={[sbStyles.label, { color: colors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, alignSelf: 'center' },
  bars: { width: 170, flexDirection: 'row', gap: 5 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontFamily: 'Inter_500Medium', width: 34, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 0,
    backgroundColor: '#f1f2f1',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  stepCounter: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#606864',
    letterSpacing: -0.1,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#E8ECF0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
    minWidth: 36,
    textAlign: 'right',
  },

  section: {
    gap: 28,
  },
  ongProfileSection: {
    gap: 20,
  },
  accountTypeSection: {
    minHeight: 688,
  },
  accountTypePanel: {
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.86)',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  contactStepSection: {
    paddingTop: 0,
  },
  accessStepSection: {
    paddingTop: 0,
  },

  headingBlock: {
    gap: 8,
    marginBottom: 8,
  },
  accountTypeHeading: {
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1A1A2E',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  typeCards: {
    gap: 14,
    marginTop: 0,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#FFFFFF',
    gap: 12,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  typeCardActive: {
    borderColor: '#606864',
    backgroundColor: '#FFFFFF',
    shadowColor: '#606864',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F6F7F8',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  typeIconWrapActive: {
    backgroundColor: '#606864',
    shadowColor: '#606864',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  typeContent: {
    flex: 1,
    gap: 2,
  },
  typeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  typeTitleActive: {
    color: '#111827',
  },
  typeDesc: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#8A94A6',
    lineHeight: 16,
  },
  typeCheck: {
    position: 'absolute',
    top: 12,
    right: 14,
  },

  fields: {
    gap: 20,
  },
  addressFields: {
    gap: 14,
  },
  ongStepPanel: {
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.86)',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  ongProfilePanel: {
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE6E1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  fieldGroup: {
    gap: 8,
  },
  addressFieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A2E',
    marginLeft: 4,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 41.8,
    marginBottom: 10,
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0,
    paddingLeft: 7,
    paddingRight: 15,
    borderWidth: 0,
    borderColor: 'transparent',
    width: '100%',
    gap: 12,
  },
  ongInputRow: {
    height: 46,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 14,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  addressInputRow: {
    height: 46,
    marginBottom: 0,
    paddingLeft: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  inputLeadingIcon: {
    marginLeft: 8,
    marginRight: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 10,
  },
  genderOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  genderOptionActive: {
    borderColor: '#2D6A4F',
    backgroundColor: 'rgba(45, 106, 79, 0.10)',
  },
  genderText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8A928B',
  },
  genderTextActive: {
    color: '#2D6A4F',
  },
  ufInputRow: {
    paddingLeft: 0,
    paddingRight: 0,
    justifyContent: 'center',
    gap: 0,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 34,
    fontFamily: 'Inter_400Regular',
  },
  ufInput: {
    width: '100%',
    fontSize: 15,
    color: '#2D3748',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 34,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },
  addressRow: {
    alignItems: 'flex-start',
  },

  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 44,
    marginBottom: 10,
    paddingLeft: 5,
    paddingRight: 15,
    gap: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: 'rgba(100, 100, 150, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0,
  },
  selectInputOpen: {
    borderColor: '#606864',
  },
  selectTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  selectValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#2D3748',
  },
  selectPlaceholder: {
    color: '#A0AEC0',
    fontFamily: 'Inter_400Regular',
  },
  selectOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    marginTop: -2,
    marginBottom: 10,
    paddingVertical: 6,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  selectOption: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  selectOptionActive: {
    backgroundColor: '#F4F6F5',
  },
  selectOptionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D3748',
  },
  selectOptionTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },

  cnpjLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
    flexWrap: 'wrap',
  },
  optionalBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
  },
  verifiedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 106, 79, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedPreviewText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D6A4F',
  },
  cnpjHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    marginTop: 6,
    lineHeight: 16,
  },

  logoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#F8FBF9',
    borderWidth: 1,
    borderColor: '#DDE6E1',
    marginBottom: 0,
  },
  logoPickerPreview: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    position: 'relative',
    overflow: 'visible',
  },
  logoPreviewImage: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  logoPickerBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BCD4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoPickerTextWrap: {
    flex: 1,
    gap: 2,
  },
  logoPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  logoPickerHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  kybList: {
    gap: 10,
    marginBottom: 8,
  },
  kybRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  kybRowComplete: {
    borderColor: '#2D6A4F',
    backgroundColor: 'rgba(45, 106, 79, 0.06)',
  },
  kybIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 106, 79, 0.10)',
  },
  kybIconWrapComplete: {
    backgroundColor: '#2D6A4F',
  },
  cepLoadingText: {
    fontSize: 12,
    color: '#00BCD4',
    fontWeight: '600',
    marginTop: 6,
  },

  ongBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  ongBadgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#606864',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 35 : 25,
    width: '100%',
    shadowColor: '#606864',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0,
  },
  primaryBtnActive: {
    backgroundColor: '#606864',
    shadowColor: '#606864',
  },
  primaryBtnDisabled: {
    backgroundColor: '#606864',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.58,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  buttonDisabled: {
    backgroundColor: '#606864',
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.58,
  },

  terms: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  termsRow: {
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  termsCheckboxChecked: {
    backgroundColor: 'rgba(45, 106, 79, 0.88)',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#2D3748',
  },
  privacyLink: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#2D6A4F',
    textAlign: 'center',
    marginTop: 8,
  },
  loginBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 32,
    backgroundColor: 'transparent',
    marginTop: 18,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  loginLink: {
    fontFamily: 'Inter_600SemiBold',
    color: '#606864',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bottomBrand: {
    marginTop: 'auto',
    paddingTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  bottomBrandLogo: {
    position: 'relative',
    top: 10,
    width: 36.9,
    height: 36.9,
    borderRadius: 8,
  },
  bottomBrandText: {
    marginLeft: -1,
    top: 10,
    fontSize: 27.2,
    fontFamily: 'Montserrat_700Bold',
    color: '#606864',
    letterSpacing: -1,
    lineHeight: 33.9,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
