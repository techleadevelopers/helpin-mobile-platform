import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { createZooHelpApi } from '@/services/zoohelpApi';
import type { ImpactMetricsContract } from '@/services/zoohelpEngine';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function formatCount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function formatDuration(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  return `${Math.round(minutes / 60)}h`;
}

export function ImpactMetricsStrip() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<ImpactMetricsContract | null>(null);

  useEffect(() => {
    let mounted = true;
    const api = createZooHelpApi();
    api?.impactMetrics()
      .then((payload) => {
        if (mounted) setMetrics(payload);
      })
      .catch(() => {
        if (mounted) setMetrics(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo<Array<{ label: string; value: string; icon: MCIcon }>>(() => {
    if (!metrics) return [];
    const firstHelp = formatDuration(metrics.firstHelpResponseSeconds ?? metrics.medianFirstResponseSeconds);
    const firstResolved = formatDuration(metrics.firstAnimalResolvedSeconds);
    const firstOngSupport = formatDuration(metrics.firstOngSupportSeconds);
    return [
      { label: 'resolvidos', value: formatCount(Math.max(metrics.animalsHelped, metrics.resolvedCases)), icon: 'check-decagram-outline' },
      { label: '1a ajuda', value: firstHelp ?? 'medindo', icon: 'hand-heart-outline' },
      { label: '1o resgate', value: firstResolved ?? 'medindo', icon: 'shield-check-outline' },
      { label: '1o apoio ONG', value: firstOngSupport ?? (metrics.supportedOngs ? formatCount(metrics.supportedOngs) : 'medindo'), icon: 'home-heart' },
    ];
  }, [metrics]);

  if (!metrics) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingLeft}>
          <View style={styles.liveDot} />
          <Text style={[styles.heading, { color: colors.foreground }]}>Impacto real</Text>
        </View>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>casos, resposta e rede</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={[styles.metric, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name={item.icon} size={15} color={colors.primary} />
            <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 9,
  },
  headingRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2E7D32',
  },
  heading: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
  },
  caption: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
  },
  grid: {
    flexDirection: 'row',
    gap: 6,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  value: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Montserrat_700Bold',
  },
  label: {
    fontSize: 8,
    lineHeight: 10,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
  },
});
