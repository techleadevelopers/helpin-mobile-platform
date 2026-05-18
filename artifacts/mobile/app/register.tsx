import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type AccountType = 'person' | 'ong';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ONG_TYPES = [
  { value: 'rescue', label: 'Resgate', icon: 'lifebuoy' as MCIcon },
  { value: 'adoption', label: 'Adoção', icon: 'heart-outline' as MCIcon },
  { value: 'vet', label: 'Veterinária', icon: 'medical-bag' as MCIcon },
  { value: 'hospital', label: 'Hospital', icon: 'hospital-building' as MCIcon },
  { value: 'welfare', label: 'Bem-estar', icon: 'paw' as MCIcon },
];

function totalSteps(type: AccountType | null) {
  if (!type) return 1;
  return type === 'person' ? 3 : 4;
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useApp();

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(false);

  // Personal fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ONG-specific fields
  const [ongName, setOngName] = useState('');
  const [ongType, setOngType] = useState('');
  const [ongCnpj, setOngCnpj] = useState('');
  const [ongEmail, setOngEmail] = useState('');
  const [ongPhone, setOngPhone] = useState('');
  const [ongCity, setOngCity] = useState('');
  const [ongState, setOngState] = useState('');
  const [ongPassword, setOngPassword] = useState('');
  const [showOngPassword, setShowOngPassword] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
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

  function validateAndNext() {
    if (step === 0) {
      if (!accountType) {
        Alert.alert('Selecione um tipo de conta', 'Escolha entre Conta Pessoal ou ONG.');
        return;
      }
      goNext(1);
      return;
    }

    if (accountType === 'person') {
      if (step === 1) {
        if (!name.trim()) { Alert.alert('Campo obrigatório', 'Informe seu nome completo.'); return; }
        if (!email.trim() || !email.includes('@')) { Alert.alert('E-mail inválido', 'Informe um e-mail válido.'); return; }
        goNext(2);
      } else if (step === 2) {
        if (password.length < 6) { Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.'); return; }
        if (password !== confirmPassword) { Alert.alert('Senhas diferentes', 'As senhas não coincidem.'); return; }
        handleSubmit();
      }
      return;
    }

    if (accountType === 'ong') {
      if (step === 1) {
        if (!ongName.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome da ONG.'); return; }
        if (!ongType) { Alert.alert('Campo obrigatório', 'Selecione o tipo de atuação.'); return; }
        goNext(2);
      } else if (step === 2) {
        if (!ongEmail.trim() || !ongEmail.includes('@')) { Alert.alert('E-mail inválido', 'Informe um e-mail válido.'); return; }
        if (!ongPhone.trim()) { Alert.alert('Campo obrigatório', 'Informe o telefone/WhatsApp.'); return; }
        if (!ongCity.trim()) { Alert.alert('Campo obrigatório', 'Informe a cidade.'); return; }
        goNext(3);
      } else if (step === 3) {
        if (ongPassword.length < 6) { Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.'); return; }
        handleSubmit();
      }
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (accountType === 'person') {
        await register(name.trim(), email.trim(), password, 'person');
      } else {
        await register(ongName.trim(), ongEmail.trim(), ongPassword, 'ong');
      }
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function formatPhone(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stepLabel = step === 0
    ? 'Tipo de conta'
    : accountType === 'person'
      ? (['', 'Seus dados', 'Sua senha'][step] ?? '')
      : (['', 'Dados da ONG', 'Contato', 'Acesso'][step] ?? '');

  return (
    <LinearGradient colors={['#EAF7EA', '#FFFFFF']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            {step > 0 && (
              <Text style={styles.stepLabel}>{stepLabel}</Text>
            )}
            <View style={{ width: 36 }} />
          </View>

          {/* ── Progress bar ── */}
          {step > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressTrack, { backgroundColor: '#E8ECF0' }]}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth, backgroundColor: accountType === 'ong' ? '#4CAF50' : '#4CAF50' }]}
                />
              </View>
              <Text style={styles.progressText}>{step} de {total - 1}</Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

            {/* ══════════════════════════════════
                STEP 0 — Tipo de conta
            ══════════════════════════════════ */}
            {step === 0 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Criar conta</Text>
                  <Text style={styles.subtitle}>Selecione o tipo de perfil que melhor representa você</Text>
                </View>

                <View style={styles.typeCards}>
                  <TouchableOpacity
                    style={[
                      styles.typeCard,
                      { borderColor: accountType === 'person' ? '#4CAF50' : '#E8ECF0', backgroundColor: accountType === 'person' ? '#F0FBF0' : '#FFFFFF' },
                    ]}
                    onPress={() => setAccountType('person')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.typeIconWrap, { backgroundColor: accountType === 'person' ? '#4CAF50' : '#F0F2F5' }]}>
                      <MaterialCommunityIcons name="account-outline" size={26} color={accountType === 'person' ? '#FFFFFF' : '#8E8E93'} />
                    </View>
                    <Text style={[styles.typeTitle, { color: accountType === 'person' ? '#4CAF50' : '#1A1A2E' }]}>Conta Pessoal</Text>
                    <Text style={styles.typeDesc}>Adotante, protetor independente ou voluntário</Text>
                    {accountType === 'person' && (
                      <View style={styles.typeCheck}>
                        <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeCard,
                      { borderColor: accountType === 'ong' ? '#4CAF50' : '#E8ECF0', backgroundColor: accountType === 'ong' ? '#EAF7EA' : '#FFFFFF' },
                    ]}
                    onPress={() => setAccountType('ong')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.typeIconWrap, { backgroundColor: accountType === 'ong' ? '#4CAF50' : '#F0F2F5' }]}>
                      <MaterialCommunityIcons name="home-heart" size={26} color={accountType === 'ong' ? '#FFFFFF' : '#8E8E93'} />
                    </View>
                    <Text style={[styles.typeTitle, { color: accountType === 'ong' ? '#4CAF50' : '#1A1A2E' }]}>ONG / Protetor</Text>
                    <Text style={styles.typeDesc}>Organização de resgate, adoção ou clínica veterinária</Text>
                    {accountType === 'ong' && (
                      <View style={styles.typeCheck}>
                        <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: accountType ? (accountType === 'ong' ? '#4CAF50' : '#4CAF50') : '#C8D6E5', shadowColor: accountType ? (accountType === 'ong' ? '#4CAF50' : '#4CAF50') : 'transparent' }]}
                  onPress={validateAndNext}
                  activeOpacity={0.88}
                  disabled={!accountType}
                >
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginBtn} onPress={() => router.back()}>
                  <Text style={styles.loginText}>
                    Já tem conta?{'  '}
                    <Text style={[styles.loginLink, { color: '#4CAF50' }]}>Entrar</Text>
                  </Text>
                </TouchableOpacity>
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
                    <View style={[styles.inputRow, { borderColor: name ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="account-outline" size={18} color={name ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Seu nome completo"
                        placeholderTextColor="#B0B8C1"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <View style={[styles.inputRow, { borderColor: email ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={email ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="seu@email.com"
                        placeholderTextColor="#B0B8C1"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4CAF50', shadowColor: '#4CAF50' }]} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
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
                    <View style={[styles.inputRow, { borderColor: password.length >= 6 ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={password.length >= 6 ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="#B0B8C1"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Confirmar senha</Text>
                    <View style={[styles.inputRow, { borderColor: confirmPassword && confirmPassword === password ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="lock-check-outline" size={18} color={confirmPassword && confirmPassword === password ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Repita a senha"
                        placeholderTextColor="#B0B8C1"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <StrengthBar password={password} />
                </View>

                <Text style={styles.terms}>
                  Ao criar sua conta você concorda com os{' '}
                  <Text style={{ color: '#4CAF50', fontFamily: 'Inter_500Medium' }}>Termos de Uso</Text>
                  {' '}e{' '}
                  <Text style={{ color: '#4CAF50', fontFamily: 'Inter_500Medium' }}>Política de Privacidade</Text>
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: loading ? '#B0B8C1' : '#4CAF50', shadowColor: '#4CAF50' }]}
                  onPress={validateAndNext}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Criando conta...' : 'Criar conta'}</Text>
                  {!loading && <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 1: Nome + Tipo
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 1 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Sua ONG</Text>
                  <Text style={styles.subtitle}>Qual é o nome e o foco de atuação?</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Nome da ONG / Organização</Text>
                    <View style={[styles.inputRow, { borderColor: ongName ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="home-heart" size={18} color={ongName ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Patinhas Felizes"
                        placeholderTextColor="#B0B8C1"
                        autoCapitalize="words"
                        value={ongName}
                        onChangeText={setOngName}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Área de atuação</Text>
                    <View style={styles.ongTypeGrid}>
                      {ONG_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.value}
                          style={[
                            styles.ongTypeChip,
                            { borderColor: ongType === t.value ? '#4CAF50' : '#E8ECF0', backgroundColor: ongType === t.value ? '#EAF7EA' : '#FFFFFF' },
                          ]}
                          onPress={() => setOngType(t.value)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name={t.icon} size={16} color={ongType === t.value ? '#4CAF50' : '#8E8E93'} />
                          <Text style={[styles.ongTypeLabel, { color: ongType === t.value ? '#4CAF50' : '#1A1A2E' }]}>{t.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <View style={styles.cnpjLabelRow}>
                      <Text style={styles.fieldLabel}>CNPJ</Text>
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalText}>opcional</Text>
                      </View>
                      {cnpjComplete && (
                        <View style={styles.verifiedPreview}>
                          <MaterialCommunityIcons name="shield-check" size={11} color="#4CAF50" />
                          <Text style={styles.verifiedPreviewText}>Ganha selo Verificado</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.inputRow, { borderColor: cnpjComplete ? '#4CAF50' : ongCnpj ? '#E8ECF0' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={18} color={cnpjComplete ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="00.000.000/0000-00"
                        placeholderTextColor="#B0B8C1"
                        keyboardType="numeric"
                        value={ongCnpj}
                        onChangeText={(t) => setOngCnpj(formatCnpj(t))}
                      />
                      {cnpjComplete && (
                        <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                      )}
                    </View>
                    <Text style={styles.cnpjHint}>
                      ONGs com CNPJ válido recebem o selo de verificação no perfil.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4CAF50', shadowColor: '#4CAF50' }]} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 2: Contato
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 2 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Contato</Text>
                  <Text style={styles.subtitle}>Como adotantes e voluntários entram em contato?</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>E-mail oficial</Text>
                    <View style={[styles.inputRow, { borderColor: ongEmail ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="email-outline" size={18} color={ongEmail ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="contato@suaong.org"
                        placeholderTextColor="#B0B8C1"
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
                    <View style={[styles.inputRow, { borderColor: ongPhone ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="whatsapp" size={18} color={ongPhone ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="(00) 00000-0000"
                        placeholderTextColor="#B0B8C1"
                        keyboardType="phone-pad"
                        value={ongPhone}
                        onChangeText={(t) => setOngPhone(formatPhone(t))}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Cidade</Text>
                      <View style={[styles.inputRow, { borderColor: ongCity ? '#4CAF50' : '#E8ECF0' }]}>
                        <MaterialCommunityIcons name="map-marker-outline" size={18} color={ongCity ? '#4CAF50' : '#8E8E93'} />
                        <TextInput
                          style={styles.input}
                          placeholder="Sua cidade"
                          placeholderTextColor="#B0B8C1"
                          autoCapitalize="words"
                          value={ongCity}
                          onChangeText={setOngCity}
                        />
                      </View>
                    </View>

                    <View style={[styles.fieldGroup, { width: 80 }]}>
                      <Text style={styles.fieldLabel}>UF</Text>
                      <View style={[styles.inputRow, { borderColor: ongState ? '#4CAF50' : '#E8ECF0' }]}>
                        <TextInput
                          style={[styles.input, { textAlign: 'center' }]}
                          placeholder="SP"
                          placeholderTextColor="#B0B8C1"
                          autoCapitalize="characters"
                          maxLength={2}
                          value={ongState}
                          onChangeText={(t) => setOngState(t.toUpperCase())}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#4CAF50', shadowColor: '#4CAF50' }]} onPress={validateAndNext} activeOpacity={0.88}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* ══════════════════════════════════
                ONG — Step 3: Senha
            ══════════════════════════════════ */}
            {accountType === 'ong' && step === 3 && (
              <View style={styles.section}>
                <View style={styles.headingBlock}>
                  <Text style={styles.title}>Acesso seguro</Text>
                  <Text style={styles.subtitle}>Crie uma senha para acessar a conta da ONG</Text>
                </View>

                <View style={styles.fields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Senha</Text>
                    <View style={[styles.inputRow, { borderColor: ongPassword.length >= 6 ? '#4CAF50' : '#E8ECF0' }]}>
                      <MaterialCommunityIcons name="lock-outline" size={18} color={ongPassword.length >= 6 ? '#4CAF50' : '#8E8E93'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="#B0B8C1"
                        secureTextEntry={!showOngPassword}
                        value={ongPassword}
                        onChangeText={setOngPassword}
                      />
                      <TouchableOpacity onPress={() => setShowOngPassword(!showOngPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name={showOngPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <StrengthBar password={ongPassword} color="#4CAF50" />

                  <View style={[styles.ongBadge, { backgroundColor: '#EAF7EA' }]}>
                    <MaterialCommunityIcons name="shield-check-outline" size={18} color="#4CAF50" />
                    <Text style={[styles.ongBadgeText, { color: '#4CAF50' }]}>
                      Sua ONG receberá um selo de verificação após análise da equipe ZooHelp
                    </Text>
                  </View>
                </View>

                <Text style={styles.terms}>
                  Ao criar sua conta você concorda com os{' '}
                  <Text style={{ color: '#4CAF50', fontFamily: 'Inter_500Medium' }}>Termos de Uso</Text>
                  {' '}e{' '}
                  <Text style={{ color: '#4CAF50', fontFamily: 'Inter_500Medium' }}>Política de Privacidade</Text>
                </Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: loading ? '#B0B8C1' : '#4CAF50', shadowColor: '#4CAF50' }]}
                  onPress={validateAndNext}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Criando conta...' : 'Cadastrar ONG'}</Text>
                  {!loading && <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function StrengthBar({ password, color = '#4CAF50' }: { password: string; color?: string }) {
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const labels = ['', 'Fraca', 'Boa', 'Forte'];
  const colors = ['', '#FF6B6B', '#FF9800', '#4CAF50'];
  if (!password) return null;
  return (
    <View style={sbStyles.wrap}>
      <View style={sbStyles.bars}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[sbStyles.bar, { backgroundColor: strength >= i ? (i === 1 ? '#FF6B6B' : i === 2 ? '#FF9800' : color) : '#E8ECF0' }]}
          />
        ))}
      </View>
      <Text style={[sbStyles.label, { color: colors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  bars: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 42, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 0 },

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
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8E8E93',
    letterSpacing: 0.2,
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

  section: { gap: 24 },

  headingBlock: { gap: 6 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#1A1A2E', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#8E8E93', lineHeight: 22 },

  typeCards: { gap: 14 },
  typeCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 2,
    gap: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typeTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  typeDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#8E8E93', lineHeight: 18 },
  typeCheck: { position: 'absolute', top: 16, right: 16 },

  fields: { gap: 18 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A1A2E', marginLeft: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1A1A2E',
  },

  row: { flexDirection: 'row', gap: 12 },

  ongTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ongTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  ongTypeLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  cnpjLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  optionalBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionalText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#8E8E93' },
  verifiedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF7EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedPreviewText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#4CAF50' },
  cnpjHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    marginTop: 5,
    lineHeight: 16,
  },

  ongBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  ongBadgeText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },

  terms: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: -4,
  },
  loginBtn: { alignItems: 'center', paddingVertical: 4 },
  loginText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#8E8E93' },
  loginLink: { fontFamily: 'Inter_600SemiBold' },
});
