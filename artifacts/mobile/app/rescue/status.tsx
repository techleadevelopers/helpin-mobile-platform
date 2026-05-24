import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { endRescue, startRescueLocationSync, triggerRescue } from '@/services/rescueService';
import { shareZooHelpItem } from '@/services/share';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { RescueSessionContract } from '@/services/zoohelpEngine';

type RescueUiStatus = 'starting' | 'active' | 'pending_sync' | 'address_only' | 'failed' | 'ended';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RescueStatusScreen() {
  const { postId, rescueId, address } = useLocalSearchParams<{ postId?: string; rescueId?: string; address?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pendingOutboxCount, syncPendingOperations } = useApp();
  const [session, setSession] = useState<RescueSessionContract | null>(null);
  const [status, setStatus] = useState<RescueUiStatus>('starting');
  const [openingChat, setOpeningChat] = useState(false);

  const resolvedPostId = typeof postId === 'string' ? postId : '';
  const resolvedAddress = typeof address === 'string' ? decodeURIComponent(address) : '';
  const isServerPost = UUID_RE.test(resolvedPostId);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    async function start() {
      if (!resolvedPostId) {
        setStatus('failed');
        return;
      }
      if (!isServerPost) {
        setStatus('pending_sync');
        return;
      }
      if (Platform.OS === 'web') {
        setStatus('address_only');
        return;
      }

      const rescue = rescueId
        ? ({
            id: rescueId,
            postId: resolvedPostId,
            status: 'active',
            lat: 0,
            lng: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as RescueSessionContract)
        : await triggerRescue(resolvedPostId);

      if (cancelled) return;
      if (!rescue) {
        setStatus('failed');
        return;
      }
      setSession(rescue);
      setStatus(rescue.id.startsWith('local-') ? 'pending_sync' : 'active');
      const watcher = await startRescueLocationSync(rescue.id);
      if (cancelled) watcher?.remove();
      else subscription = watcher;
    }

    start().catch(() => setStatus('failed'));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [isServerPost, rescueId, resolvedPostId]);

  const title = useMemo(() => {
    if (status === 'active') return 'Alerta enviado';
    if (status === 'address_only') return 'Alerta publicado';
    if (status === 'pending_sync') return 'Envio pendente';
    if (status === 'failed') return 'Falha no resgate';
    if (status === 'ended') return 'Resgate encerrado';
    return 'Acionando resgate';
  }, [status]);

  async function handleSync() {
    await syncPendingOperations().catch(() => {});
    if (isServerPost && status === 'pending_sync') {
      setStatus('starting');
      const rescue = await triggerRescue(resolvedPostId);
      if (rescue) {
        setSession(rescue);
        setStatus(rescue.id.startsWith('local-') ? 'pending_sync' : 'active');
      }
    }
  }

  async function openChat() {
    if (!resolvedPostId) return;
    setOpeningChat(true);
    try {
      const rooms = await createZooHelpApi()?.chatRooms({ postId: resolvedPostId });
      const room = rooms?.find((item) => item.postId === resolvedPostId);
      if (room) {
        router.push(`/chat/${room.id}` as any);
      } else {
        Alert.alert('Chat indisponivel', 'O chat deste caso ainda nao foi criado no servidor.');
      }
    } finally {
      setOpeningChat(false);
    }
  }

  async function finishRescue() {
    if (!session?.id) {
      router.replace('/(tabs)' as any);
      return;
    }
    await endRescue(session.id).catch(() => null);
    setStatus('ended');
    router.replace('/(tabs)' as any);
  }

  const topPad = Platform.OS === 'web' ? 52 : insets.top + 16;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 20;
  const active = status === 'active';
  const pending = status === 'pending_sync';
  const addressOnly = status === 'address_only';
  const failed = status === 'failed';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.78}>
          <MaterialCommunityIcons name="arrow-left" size={23} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Resgate</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.statusPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.statusIcon, { backgroundColor: failed ? '#C95A5A18' : pending ? '#D4A25918' : '#2D6A4F18' }]}>
          {status === 'starting' ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name={failed ? 'alert-octagon' : pending ? 'cloud-sync-outline' : 'shield-check'}
              size={34}
              color={failed ? '#C95A5A' : pending ? '#D4A259' : '#2D6A4F'}
            />
          )}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {active
            ? 'GPS ativo, localizacao em atualizacao e chat pronto para coordenacao.'
            : addressOnly
              ? 'Post urgente criado com endereço manual. No PC, o rastreamento GPS em tempo real fica desativado.'
            : pending
              ? 'Sem confirmacao do servidor ainda. O pedido fica na fila local e sera reenviado.'
              : failed
                ? 'Nao foi possivel confirmar o alerta. Verifique GPS e conexao.'
                : 'Confirmando localizacao e abrindo sessao operacional.'}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: active ? '#2D6A4F' : pending ? '#D4A259' : colors.foreground }]}>
            {active || addressOnly ? 'OK' : pending ? pendingOutboxCount : '--'}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>envio</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{addressOnly ? 'END.' : 'GPS'}</Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>rastreamento</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metricValue, { color: colors.foreground }]}>{session?.id ? 'SIM' : '--'}</Text>
          <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>sessao</Text>
        </View>
      </View>

      {addressOnly && resolvedAddress ? (
        <View style={[styles.addressPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.primary} />
          <Text style={[styles.addressText, { color: colors.foreground }]}>{resolvedAddress}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: active ? colors.primary : '#D4A259' }]}
          onPress={addressOnly ? () => router.replace('/(tabs)' as any) : pending ? handleSync : openChat}
          disabled={status === 'starting' || openingChat}
          activeOpacity={0.84}
        >
          <MaterialCommunityIcons name={addressOnly ? 'format-list-bulleted' : pending ? 'sync' : 'chat-processing'} size={19} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>
            {addressOnly ? 'Voltar ao feed' : pending ? 'Sincronizar agora' : openingChat ? 'Abrindo' : 'Abrir chat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryAction, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => shareZooHelpItem('ZooHelp', `Caso de resgate ZooHelp: ${resolvedPostId}`)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={19} color={colors.foreground} />
          <Text style={[styles.secondaryActionText, { color: colors.foreground }]}>Compartilhar caso</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.safeAction, { borderColor: '#2D6A4F40' }]}
          onPress={finishRescue}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={19} color="#2D6A4F" />
          <Text style={styles.safeActionText}>Estou seguro / encerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  header: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  statusPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  addressPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 8,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  metricValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  metricLabel: { marginTop: 3, fontSize: 11, fontFamily: 'Inter_500Medium' },
  actions: { marginTop: 'auto', gap: 10 },
  primaryAction: {
    minHeight: 54,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
  secondaryAction: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  safeAction: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  safeActionText: { color: '#2D6A4F', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
