import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { OperationalStatus } from '@/components/OperationalStatus';
import { StatusBadge } from '@/components/StatusBadge';
import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import type { Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PRIMARY = '#2D6A4F';
const INK = '#18231B';
const TEXT = '#3D473F';
const MUTED = '#7C867C';
const MUTED_2 = '#8A928B';
const BG = '#F7F8F4';
const CARD = '#FFFFFF';
const GREEN_SOFT = '#EAF7EF';
const BORDER = '#E4EAE5';
const BORDER_SOFT = '#E8EDE8';
const DANGER = '#C95A5A';

function isResolved(post: Post) {
  return post.rescueStatus === 'resolved';
}

function formatLocation(user: ReturnType<typeof useApp>['user']) {
  const address = user?.profileAddress;
  if (address?.city && address?.state) return `${address.city}-${address.state}`;
  if (address?.city) return address.city;
  return 'Brasil';
}

function formatVerification(user: ReturnType<typeof useApp>['user']) {
  if (!user?.verified) return user?.verificationStatus === 'REJECTED' ? 'Revisao solicitada' : 'Em analise';
  return 'Verificada';
}

function compactNumber(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return String(value);
}

function SectionHeader({
  icon,
  title,
  action,
  onAction,
}: {
  icon: MCIcon;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <MaterialCommunityIcons name={icon} size={18} color={PRIMARY} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.78}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: 'danger' | 'primary' }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, tone === 'danger' && styles.metricDanger, tone === 'primary' && styles.metricPrimary]}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: MCIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.84}>
      <View style={styles.quickIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={PRIMARY} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrimaryAction({
  icon,
  label,
  onPress,
  secondary,
}: {
  icon: MCIcon;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryAction, secondary && styles.secondaryAction]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <MaterialCommunityIcons name={icon} size={18} color={secondary ? PRIMARY : '#FFFFFF'} />
      <Text style={[styles.primaryActionText, secondary && styles.secondaryActionText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CaseCard({
  post,
  onOpen,
  onChat,
  onMap,
}: {
  post: Post;
  onOpen: () => void;
  onChat: () => void;
  onMap: () => void;
}) {
  const urgent = post.urgent || post.type === 'emergency';

  return (
    <View style={[styles.caseCard, urgent && styles.caseCardUrgent]}>
      <View style={styles.caseTop}>
        <Avatar name={post.author.name} size={42} verified={post.author.verified} type={post.author.type} imageUrl={post.author.avatar} />
        <View style={styles.caseInfo}>
          <View style={styles.caseTitleRow}>
            <Text style={styles.caseTitle} numberOfLines={1}>{post.author.name || 'Usuario'}</Text>
            <StatusBadge type={post.type} urgent={urgent && !isResolved(post)} resolved={isResolved(post)} size="xs" hideType />
          </View>
          <Text style={styles.caseLocation} numberOfLines={1}>{post.neighborhood || post.location || 'Local nao informado'}</Text>
        </View>
      </View>
      <Text style={styles.caseDescription} numberOfLines={2}>{post.description || 'Caso aguardando acao da ONG.'}</Text>
      <OperationalStatus post={post} variant="compact" />
      <View style={styles.caseActions}>
        <TouchableOpacity style={styles.caseActionBtn} onPress={onOpen} activeOpacity={0.8}>
          <MaterialCommunityIcons name="eye-outline" size={14} color={PRIMARY} />
          <Text style={styles.caseActionText}>Detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.caseActionBtn} onPress={onChat} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chat-outline" size={14} color={PRIMARY} />
          <Text style={styles.caseActionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.caseActionBtn} onPress={onMap} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-outline" size={14} color={PRIMARY} />
          <Text style={styles.caseActionText}>Mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <MaterialCommunityIcons name="paw-outline" size={22} color={MUTED_2} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function OngDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { posts, refreshPosts, refreshUser, user, chatUnreadCount, chatMessageNotifications } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const ongPosts = useMemo(
    () => posts.filter((post) => post.author.id === user?.id),
    [posts, user?.id],
  );
  const urgentCases = useMemo(
    () => posts.filter((post) => !isResolved(post) && (post.urgent || post.type === 'emergency')).slice(0, 3),
    [posts],
  );
  const activeOngCases = useMemo(
    () => ongPosts.filter((post) => !isResolved(post)).slice(0, 3),
    [ongPosts],
  );
  const adoptionCount = ongPosts.filter((post) => post.type === 'adoption').length;
  const unreadNotifications = chatMessageNotifications.filter((item) => !item.isRead).length;
  const unreadTotal = chatUnreadCount + unreadNotifications;
  const verificationLabel = formatVerification(user);
  const isPendingReview = user?.type === 'ong' && !user?.verified;
  const location = formatLocation(user);

  function push(route: string) {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshUser(), refreshPosts()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ZooHelpHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarRing}>
              <Avatar name={user?.name ?? 'ONG'} size={70} verified={user?.verified} type="ong" imageUrl={user?.avatar} />
            </View>
            <View style={styles.profileIdentity}>
              <Text style={styles.accountType}>ONG</Text>
              <Text style={styles.ongName} numberOfLines={2}>{user?.name || 'Instituicao Resgate'}</Text>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name={user?.verified ? 'shield-check-outline' : 'clock-outline'} size={13} color={MUTED} />
                <Text style={styles.metaText} numberOfLines={1}>{location} · {verificationLabel}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => push('/(tabs)/profile')} activeOpacity={0.82}>
              <MaterialCommunityIcons name="account-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.metricsRow}>
            <Metric label="alertas" value={urgentCases.length} tone={urgentCases.length > 0 ? 'danger' : undefined} />
            <View style={styles.metricDivider} />
            <Metric label="chat" value={unreadTotal} tone={unreadTotal > 0 ? 'primary' : undefined} />
            <View style={styles.metricDivider} />
            <Metric label="casos" value={compactNumber(ongPosts.length)} />
            <View style={styles.metricDivider} />
            <Metric label="adocoes" value={adoptionCount} />
          </View>
        </View>

        {isPendingReview && (
          <View style={styles.reviewBanner}>
            <MaterialCommunityIcons name="shield-alert-outline" size={18} color="#B37A15" />
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewTitle}>Conta em analise</Text>
              <Text style={styles.reviewText}>A equipe ZooHelp esta validando os dados da ONG antes do selo.</Text>
            </View>
          </View>
        )}

        <View style={styles.quickCard}>
          <View style={styles.quickGrid}>
            <QuickAction icon="ambulance" label="Resgate" onPress={() => push('/composer?type=emergency&rescue=1')} />
            <QuickAction icon="home-heart" label="Adocao" onPress={() => push('/composer?type=adoption')} />
            <QuickAction icon="bullhorn-outline" label="Atualizar" onPress={() => push('/composer?type=post')} />
            <QuickAction icon="clipboard-text-outline" label="Casos" onPress={() => push('/(tabs)/cases')} />
          </View>
          <View style={styles.primaryActionsRow}>
            <PrimaryAction icon="plus-circle-outline" label="Novo resgate" onPress={() => push('/composer?type=emergency&rescue=1')} />
            <PrimaryAction icon="home-heart" label="Adocao" onPress={() => push('/composer?type=adoption')} secondary />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader icon="bell-alert-outline" title="Precisa de atencao" action="Ver mapa" onAction={() => push('/(tabs)/map')} />
          {urgentCases.length > 0 ? (
            <View style={styles.caseList}>
              {urgentCases.map((post) => (
                <CaseCard
                  key={post.id}
                  post={post}
                  onOpen={() => push(`/post/${post.id}`)}
                  onChat={() => push('/(tabs)/chat')}
                  onMap={() => push('/(tabs)/map')}
                />
              ))}
            </View>
          ) : (
            <EmptyCard text="Nenhum alerta urgente agora." />
          )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader icon="check-circle-outline" title="Acompanhamentos" action="Ver todas" onAction={() => push('/(tabs)/cases')} />
          {activeOngCases.length > 0 ? (
            <View style={styles.followList}>
              {activeOngCases.map((post) => (
                <TouchableOpacity key={post.id} style={styles.followRow} onPress={() => push(`/post/${post.id}`)} activeOpacity={0.84}>
                  <View style={styles.followIcon}>
                    <MaterialCommunityIcons name="home-heart" size={20} color={PRIMARY} />
                  </View>
                  <View style={styles.followInfo}>
                    <Text style={styles.followTitle} numberOfLines={1}>{post.name || 'Caso em acompanhamento'}</Text>
                    <Text style={styles.followMeta} numberOfLines={2}>{post.neighborhood || post.location}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={MUTED_2} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyCard text="Nenhum caso proprio em acompanhamento." />
          )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader icon="chat-outline" title="Conversas" action="Abrir" onAction={() => push('/(tabs)/chat')} />
          <TouchableOpacity style={styles.chatRow} onPress={() => push('/(tabs)/chat')} activeOpacity={0.84}>
            <View style={styles.chatIcon}>
              <MaterialCommunityIcons name="chat-processing-outline" size={21} color={PRIMARY} />
            </View>
            <View style={styles.chatCopy}>
              <Text style={styles.chatTitle}>Central de atendimento</Text>
              <Text style={styles.chatMeta}>{unreadTotal > 0 ? `${unreadTotal} mensagens pendentes` : 'Nenhuma mensagem pendente'}</Text>
            </View>
            {unreadTotal > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { padding: 18, gap: 14 },
  profileCard: {
    borderRadius: 24,
    padding: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  profileIdentity: { flex: 1, gap: 3 },
  accountType: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: PRIMARY, letterSpacing: 0.2 },
  ongName: { fontSize: 17, fontFamily: 'Montserrat_700Bold', color: INK, letterSpacing: -0.25, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { flex: 1, fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_SOFT,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: INK },
  metricDanger: { color: DANGER },
  metricPrimary: { color: PRIMARY },
  metricLabel: { fontSize: 9, fontFamily: 'Montserrat_500Medium', color: MUTED, textTransform: 'lowercase' },
  metricDivider: { width: 1, height: 28, backgroundColor: BORDER },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F2DEAE',
  },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#5D4614' },
  reviewText: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: '#8A6E29', lineHeight: 16 },
  quickCard: {
    padding: 12,
    gap: 14,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickAction: {
    flex: 1,
    minHeight: 86,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F4F6F3',
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDEBE1',
  },
  quickLabel: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: TEXT },
  primaryActionsRow: { flexDirection: 'row', gap: 10 },
  primaryAction: {
    flex: 1.35,
    minHeight: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#586158',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  primaryActionText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  secondaryActionText: { color: PRIMARY },
  sectionCard: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#1C251D', letterSpacing: -0.25 },
  sectionAction: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: TEXT },
  caseList: { gap: 10 },
  caseCard: {
    padding: 12,
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
  },
  caseCardUrgent: { borderColor: '#F3C6C6', backgroundColor: '#FFFDFD' },
  caseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  caseInfo: { flex: 1, minWidth: 0, gap: 2 },
  caseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caseTitle: { flex: 1, fontSize: 13, fontFamily: 'Montserrat_700Bold', color: INK },
  caseLocation: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED },
  caseDescription: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: TEXT, lineHeight: 17 },
  caseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingTop: 1 },
  caseActionBtn: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F6F3',
    borderWidth: 1,
    borderColor: BORDER,
  },
  caseActionText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: TEXT },
  emptyCard: {
    minHeight: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4F6F3',
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: MUTED },
  followList: { gap: 8 },
  followRow: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  followIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_SOFT },
  followInfo: { flex: 1, minWidth: 0, gap: 3 },
  followTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: INK },
  followMeta: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED, lineHeight: 15 },
  chatRow: {
    minHeight: 66,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    backgroundColor: '#FFFFFF',
  },
  chatIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_SOFT },
  chatCopy: { flex: 1, gap: 2 },
  chatTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: INK },
  chatMeta: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED },
  chatBadge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: DANGER, paddingHorizontal: 7 },
  chatBadgeText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
});
