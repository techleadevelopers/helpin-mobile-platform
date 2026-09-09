import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Post, PostType } from '@/constants/data';
import { formatDistanceKm } from '@/services/geoDistance';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Tone = 'alert' | 'active' | 'resolved' | 'default';
type Variant = 'feed' | 'compact' | 'line';

const TYPE_LABELS: Record<PostType, string> = {
  adoption: 'Adoção',
  emergency: 'Emergencia',
  lost: 'Perdido',
  found: 'Encontrado',
  campaign: 'Campanha',
  post: 'Aberto',
};

function normalizeTime(value: string) {
  if (!value) return 'agora';
  if (!value.includes('T')) {
    return value
      .replace(/\batras\b/i, 'atras')
      .replace(/\b(\d+)\s+(min|h|d)\s+atras\b/i, '$1$2 atras');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'agora';

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes}min atras`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h atras`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays}d atras`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTone(post: Post): Tone {
  if (post.rescueStatus === 'resolved') return 'resolved';
  if (post.rescueStatus === 'active') return 'active';
  if (post.urgent || post.type === 'emergency') return 'alert';
  return 'default';
}

function getLead(post: Post) {
  if (post.rescueStatus === 'resolved') return 'Resgate concluido';
  if (post.rescueStatus === 'active') return 'Ajuda chegando';
  if (post.urgent) return 'Urgente';
  return TYPE_LABELS[post.type] ?? 'Aberto';
}

function getHumanState(post: Post) {
  if (post.rescueStatus === 'resolved') return 'caso encerrado';
  if ((post.rescueOperational?.helpArrivedCount ?? 0) > 0) return 'Animal encontrado/resgatado';
  if (post.rescueStatus === 'active') return 'Em atendimento';
  if ((post.rescueOperational?.helpGoingCount ?? 0) > 0) return 'Alguem respondeu';
  if (post.type === 'emergency' || post.urgent) return 'Alertando pessoas proximas';
  if (post.rescueStatus === 'active') return 'Resgate em coordenação';
  if (post.author.type === 'ong') return 'ONG acionada';
  if (post.type === 'adoption') return 'Aguardando interesse';
  if (post.type === 'lost') return 'Compartilhe se viu';
  if (post.type === 'found') return 'Tutor nao localizado';
  if (post.type === 'campaign') return 'Apoio aberto';
  return 'Aberto';
}

export function getOperationalStatus(post: Post) {
  const distance = formatDistanceKm(post.distanceKm);
  const lead = distance ? `${getLead(post)} • ${distance}` : getLead(post);

  return {
    lead,
    detail: getHumanState(post),
    time: normalizeTime(post.createdAt),
    tone: getTone(post),
  };
}

export function OperationalStatus({
  post,
  variant = 'feed',
}: {
  post: Post;
  variant?: Variant;
}) {
  const status = getOperationalStatus(post);
  const toneStyle = toneStyles[status.tone];
  const isLine = variant === 'line';

  if (isLine) {
    return (
      <Text style={[styles.lineText, toneStyle.text]} numberOfLines={1}>
        {status.lead} - {status.detail} - {status.time}
      </Text>
    );
  }

  return (
    <View style={[styles.wrap, variant === 'compact' && styles.wrapCompact]}>
      <View style={[styles.leadPill, toneStyle.pill]}>
        <MaterialCommunityIcons name={toneStyle.icon} size={variant === 'compact' ? 10 : 11} color={toneStyle.color} />
        <Text style={[styles.leadText, toneStyle.text]} numberOfLines={1}>
          {status.lead}
        </Text>
      </View>
      <Text style={[styles.detailText, variant === 'compact' && styles.detailCompact]} numberOfLines={1}>
        {status.detail}
      </Text>
      <Text style={styles.timeText} numberOfLines={1}>
        {status.time}
      </Text>
    </View>
  );
}

const toneStyles: Record<Tone, { color: string; icon: MCIcon; pill: object; text: object }> = {
  alert: {
    color: '#D84A3A',
    icon: 'alert-circle',
    pill: { backgroundColor: '#FFEDEE' },
    text: { color: '#D84A3A' },
  },
  active: {
    color: '#2D6A4F',
    icon: 'run-fast',
    pill: { backgroundColor: '#EAF3EC' },
    text: { color: '#2D6A4F' },
  },
  resolved: {
    color: '#4E6F80',
    icon: 'check-circle',
    pill: { backgroundColor: '#EEF4F6' },
    text: { color: '#4E6F80' },
  },
  default: {
    color: '#5F6861',
    icon: 'paw',
    pill: { backgroundColor: '#F1F4F0' },
    text: { color: '#5F6861' },
  },
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  wrapCompact: {
    minHeight: 21,
    gap: 5,
  },
  leadPill: {
    minHeight: 21,
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    borderRadius: 11,
  },
  leadText: {
    flexShrink: 1,
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'uppercase',
  },
  detailText: {
    flexShrink: 1,
    maxWidth: '48%',
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#5F6861',
  },
  detailCompact: {
    maxWidth: '52%',
    fontSize: 9,
  },
  timeText: {
    flexShrink: 0,
    fontSize: 9,
    fontFamily: 'Montserrat_500Medium',
    color: '#8A928B',
  },
  lineText: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#7C867C',
  },
});
