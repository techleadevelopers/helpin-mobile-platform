import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function formatCep(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function AccountDataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUserProfile } = useApp();
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const lastCepLookupRef = useRef('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const address = user?.profileAddress ?? {};
    setName(user?.name ?? '');
    setCep(formatCep(address.cep ?? ''));
    setStreet(address.street ?? '');
    setNumber(address.number ?? '');
    setComplement(address.complement ?? '');
    setNeighborhood(address.neighborhood ?? '');
    setCity(address.city ?? '');
    setState((address.state ?? '').toUpperCase());
    lastCepLookupRef.current = (address.cep ?? '').replace(/\D/g, '');
  }, [user?.id]);

  async function lookupCep(nextCep = cep) {
    const digits = nextCep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    if (lastCepLookupRef.current === digits && city && state) return;

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
      setStreet(payload.logradouro ?? '');
      setNeighborhood(payload.bairro ?? '');
      setCity(payload.localidade ?? '');
      setState((payload.uf ?? '').toUpperCase());
    } catch {
      Alert.alert('CEP indisponivel', 'Nao foi possivel consultar o CEP agora. Preencha o endereco manualmente.');
    } finally {
      setCepLoading(false);
    }
  }

  function handleCepChange(value: string) {
    const nextCep = formatCep(value);
    setCep(nextCep);
    if (nextCep.replace(/\D/g, '').length === 8) lookupCep(nextCep);
  }

  async function handleSave() {
    const cleanName = name.trim();
    if (!cleanName) {
      Alert.alert('Nome obrigatorio', 'Informe seu nome para salvar.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        name: cleanName,
        cep: cep.replace(/\D/g, ''),
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Meus dados', 'Nao foi possivel salvar seus dados agora.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.round, { backgroundColor: colors.muted }]} activeOpacity={0.82}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Meus dados</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Nome, endereco e localização operacional</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nome</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>CEP</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={cep} onChangeText={handleCepChange} onBlur={() => lookupCep()} placeholder="00000-000" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" maxLength={9} />
            {cepLoading && <Text style={[styles.help, { color: colors.primary }]}>Consultando CEP...</Text>}
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Rua</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={street} onChangeText={setStreet} placeholder="Rua" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, styles.numberField]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Numero</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={number} onChangeText={setNumber} placeholder="N" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Complemento</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={complement} onChangeText={setComplement} placeholder="Apto, bloco" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Bairro</Text>
            <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={neighborhood} onChangeText={setNeighborhood} placeholder="Bairro" placeholderTextColor={colors.mutedForeground} />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, styles.flex]}>
              <Text style={[styles.label, { color: colors.foreground }]}>Cidade</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={city} onChangeText={setCity} placeholder="Cidade" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={[styles.field, styles.stateField]}>
              <Text style={[styles.label, { color: colors.foreground }]}>UF</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} value={state} onChangeText={(value) => setState(value.toUpperCase())} placeholder="SP" placeholderTextColor={colors.mutedForeground} maxLength={2} autoCapitalize="characters" />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving} activeOpacity={0.86}>
          <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar dados'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  content: { padding: 16, paddingBottom: 104 },
  panel: { borderWidth: 1, borderRadius: 22, padding: 14, gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  help: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', gap: 9 },
  flex: { flex: 1 },
  numberField: { width: 86 },
  stateField: { width: 58 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, padding: 16 },
  saveButton: { minHeight: 48, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
