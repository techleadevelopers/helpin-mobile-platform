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

const PRIMARY = '#343e3a';
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

function isOperationalCase(post: Post) {
  return (
    post.urgent ||
    post.type === 'emergency' ||
    post.rescueOperational ||
    post.rescueStatus === 'open' ||
    post.rescueStatus === 'active'
  );
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
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
  tone = 'default',
}: {
  icon: MCIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  tone?: 'default' | 'urgent';
}) {
  const urgent = tone === 'urgent';

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, urgent && styles.sectionIconUrgent]}>
          <MaterialCommunityIcons name={icon} size={17} color={urgent ? DANGER : PRIMARY} />
        </View>
        <View style={styles.sectionTitleCopy}>
          <Text style={[styles.sectionEyebrow, urgent && styles.sectionEyebrowUrgent]}>{eyebrow}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {action && onAction && (
        <TouchableOpacity style={styles.sectionActionBtn} onPress={onAction} activeOpacity={0.78}>
          <Text style={styles.sectionAction}>{action}</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={TEXT} />
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
  support,
  onPress,
}: {
  icon: MCIcon;
  label: string;
  support: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.84}>
      <View style={styles.quickIcon}>
        <MaterialCommunityIcons name={icon} size={20} color={PRIMARY} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSupport}>{support}</Text>
    </TouchableOpacity>
  );
}

function PrimaryAction({
  icon,
  label,
  support,
  onPress,
  secondary,
}: {
  icon: MCIcon;
  label: string;
  support: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryAction, secondary && styles.secondaryAction]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={[styles.primaryActionIcon, secondary && styles.secondaryActionIcon]}>
        <MaterialCommunityIcons name={icon} size={18} color={secondary ? PRIMARY : '#FFFFFF'} />
      </View>
      <View style={styles.primaryActionCopy}>
        <Text style={[styles.primaryActionText, secondary && styles.secondaryActionText]}>{label}</Text>
        <Text style={[styles.primaryActionSupport, secondary && styles.secondaryActionSupport]}>{support}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={secondary ? '#708078' : 'rgba(255,255,255,0.8)'} />
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
      {urgent && <View style={styles.urgentAccent} />}
      {urgent && (
        <View style={styles.urgentLeadRow}>
          <MaterialCommunityIcons name="alarm-light-outline" size={12} color={DANGER} />
          <Text style={styles.urgentLead}>URGENTE AGORA</Text>
        </View>
      )}
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
      <Text style={styles.caseDescription} numberOfLines={2}>{post.description || 'Caso aguardando ação da ONG.'}</Text>
      <View style={styles.statusSurface}>
        <OperationalStatus post={post} variant="compact" />
      </View>
      <View style={styles.caseActions}>
        <TouchableOpacity style={styles.casePrimaryAction} onPress={onOpen} activeOpacity={0.84}>
          <MaterialCommunityIcons name="eye-outline" size={14} color="#FFFFFF" />
          <Text style={styles.casePrimaryActionText}>Ver caso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.caseActionBtn} onPress={onChat} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chat-outline" size={14} color={PRIMARY} />
          <Text style={styles.caseActionText}>Abrir chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.caseActionBtn} onPress={onMap} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-marker-path" size={14} color={PRIMARY} />
          <Text style={styles.caseActionText}>Rota</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyAlertCard() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="shield-check-outline" size={21} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum alerta urgente agora</Text>
      <Text style={styles.emptyText}>A rede está estável nesta região no momento.</Text>
    </View>
  );
}

function FollowEmptyCard({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.followEmptyCard}>
      <View style={styles.followEmptyIcon}>
        <MaterialCommunityIcons name="paw-outline" size={22} color={PRIMARY} />
      </View>
      <Text style={styles.followEmptyTitle}>Nenhum resgate em acompanhamento</Text>
      <Text style={styles.followEmptyText}>
        Casos aceitos aparecerão aqui com status, contatos e próximos passos.
      </Text>
      <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.82}>
        <MaterialCommunityIcons name="map-search-outline" size={14} color={PRIMARY} />
        <Text style={styles.exploreBtnText}>Explorar ocorrências</Text>
      </TouchableOpacity>
    </View>
  );
}

function MiniCaseRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const urgent = isOperationalCase(post);

  return (
    <TouchableOpacity style={styles.miniCaseRow} onPress={onPress} activeOpacity={0.84}>
      <View style={[styles.miniCaseIcon, urgent && styles.miniCaseIconUrgent]}>
        <MaterialCommunityIcons name={urgent ? 'alarm-light-outline' : 'clipboard-text-outline'} size={16} color={urgent ? DANGER : PRIMARY} />
      </View>
      <View style={styles.miniCaseCopy}>
        <View style={styles.miniCaseTitleRow}>
          <Text style={styles.miniCaseTitle} numberOfLines={1}>{post.name || post.author.name || 'Caso'}</Text>
          {urgent && <Text style={styles.miniUrgentText}>URGENTE</Text>}
        </View>
        <Text style={styles.miniCaseMeta} numberOfLines={1}>{post.neighborhood || post.location || 'Local nao informado'}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={MUTED_2} />
    </TouchableOpacity>
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
    () => posts.filter((post) => !isResolved(post) && isOperationalCase(post)).slice(0, 3),
    [posts],
  );
  const activeOngCases = useMemo(
    () => ongPosts.filter((post) => !isResolved(post)).slice(0, 3),
    [ongPosts],
  );
  const caseSnapshot = useMemo(() => {
    const seen = new Set<string>();
    return [...urgentCases, ...activeOngCases]
      .filter((post) => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      })
      .slice(0, 3);
  }, [activeOngCases, urgentCases]);
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
              <Text style={styles.ongName} numberOfLines={2}>{user?.name || 'Instituição Resgate'}</Text>
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
          <View style={styles.quickHeader}>
            <View style={styles.quickHeaderIcon}>
              <MaterialCommunityIcons name="view-dashboard-outline" size={18} color={PRIMARY} />
            </View>
            <View style={styles.quickHeaderCopy}>
              <Text style={styles.quickEyebrow}>CENTRAL OPERACIONAL</Text>
              <Text style={styles.quickTitle}>Ações da instituição</Text>
              <Text style={styles.quickSubtitle}>Publique, acompanhe e mobilize sua rede.</Text>
            </View>
          </View>

          <View style={styles.quickGrid}>
            <QuickAction icon="newspaper-variant-outline" label="Feed" support="Rede" onPress={() => push('/(tabs)/feed')} />
            <QuickAction icon="home-heart" label="Adoção" support="Publicar" onPress={() => push('/composer?type=adoption')} />
            <QuickAction icon="bullhorn-outline" label="Atualizar" support="Aviso" onPress={() => push('/composer?type=post')} />
            <QuickAction icon="clipboard-text-outline" label="Casos" support="Gestão" onPress={() => push('/(tabs)/cases')} />
          </View>

          <View style={styles.quickDivider} />

          <View style={styles.primaryActionsRow}>
            <PrimaryAction
              icon="plus-circle-outline"
              label="Resgate"
              support="Mobilizar ajuda"
              onPress={() => push('/composer?type=emergency&rescue=1')}
            />
            <PrimaryAction
              icon="home-heart"
              label="Adoção"
              support="Criar anúncio"
              onPress={() => push('/composer?type=adoption')}
              secondary
            />
          </View>
        </View>

        <View style={styles.microCasesCard}>
          <View style={styles.microCasesHeader}>
            <View style={styles.microCasesTitleWrap}>
              <Text style={styles.microCasesEyebrow}>CASOS</Text>
              <Text style={styles.microCasesTitle}>Visao rapida</Text>
            </View>
            <TouchableOpacity style={styles.microCasesAction} onPress={() => push('/(tabs)/cases')} activeOpacity={0.82}>
              <Text style={styles.microCasesActionText}>Abrir</Text>
              <MaterialCommunityIcons name="chevron-right" size={13} color={TEXT} />
            </TouchableOpacity>
          </View>
          {caseSnapshot.length > 0 ? (
            <View style={styles.microCasesList}>
              {caseSnapshot.map((post) => (
                <MiniCaseRow key={post.id} post={post} onPress={() => push(`/post/${post.id}`)} />
              ))}
            </View>
          ) : (
            <View style={styles.microCasesEmpty}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={PRIMARY} />
              <Text style={styles.microCasesEmptyText}>Nenhum caso ativo agora</Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, styles.attentionSection]}>
          <SectionHeader
            icon="bell-alert-outline"
            eyebrow="OPERAÇÃO EM TEMPO REAL"
            title="Precisa de atenção"
            subtitle={`${urgentCases.length} ocorrência${urgentCases.length === 1 ? '' : 's'} urgente${urgentCases.length === 1 ? '' : 's'} próxima${urgentCases.length === 1 ? '' : 's'}`}
            action="Ver mapa"
            onAction={() => push('/(tabs)/map')}
            tone="urgent"
          />
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
            <EmptyAlertCard />
          )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon="check-circle-outline"
            eyebrow="GESTÃO DE RESGATES"
            title="Acompanhamentos"
            subtitle="Casos assumidos pela sua instituição"
            action="Ver todas"
            onAction={() => push('/(tabs)/cases')}
          />
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
            <FollowEmptyCard onExplore={() => push('/(tabs)/cases')} />
          )}
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader
            icon="chat-outline"
            eyebrow="COMUNICAÇÃO"
            title="Conversas"
            subtitle="Coordene contatos e retornos"
            action="Abrir"
            onAction={() => push('/(tabs)/chat')}
          />
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
    padding: 14,
    gap: 13,
    borderRadius: 24,
    backgroundColor: '#FCFDFB',
    borderWidth: 1,
    borderColor: '#E3EBE5',
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 16,
    elevation: 2,
  },
  quickHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  quickHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: '#D8E9DD',
  },
  quickHeaderCopy: { flex: 1, gap: 1 },
  quickEyebrow: { fontSize: 8, fontFamily: 'Montserrat_700Bold', color: PRIMARY, letterSpacing: 0.7 },
  quickTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: INK, letterSpacing: -0.2 },
  quickSubtitle: { fontSize: 9.5, fontFamily: 'Montserrat_500Medium', color: MUTED, lineHeight: 14 },
  quickGrid: { flexDirection: 'row', gap: 8 },
  quickAction: {
    flex: 1,
    minHeight: 91,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F5F8F5',
    borderWidth: 1,
    borderColor: '#E7EEE8',
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: '#E6F2E9',
  },
  quickLabel: { fontSize: 10.5, fontFamily: 'Montserrat_700Bold', color: TEXT },
  quickSupport: { fontSize: 8.5, fontFamily: 'Montserrat_500Medium', color: MUTED },
  quickDivider: { height: 1, backgroundColor: '#E9EFEA' },
  primaryActionsRow: { flexDirection: 'row', gap: 10 },
  primaryAction: {
    flex: 1.02,
    minHeight: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 2,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  secondaryActionIcon: { backgroundColor: '#EAF5ED' },
  primaryActionCopy: { flex: 1, gap: 2 },
  primaryActionText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  secondaryActionText: { color: PRIMARY },
  primaryActionSupport: { fontSize: 8.5, fontFamily: 'Montserrat_500Medium', color: 'rgba(255,255,255,0.78)' },
  secondaryActionSupport: { color: MUTED },
  microCasesCard: {
    padding: 12,
    gap: 10,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 1,
  },
  microCasesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  microCasesTitleWrap: { flex: 1, gap: 1 },
  microCasesEyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: PRIMARY,
    letterSpacing: 0.7,
  },
  microCasesTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: INK,
  },
  microCasesAction: {
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3F6F3',
  },
  microCasesActionText: { fontSize: 9.5, fontFamily: 'Montserrat_700Bold', color: TEXT },
  microCasesList: { gap: 7 },
  miniCaseRow: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E7EEE8',
    backgroundColor: '#F8FAF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  miniCaseIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_SOFT,
  },
  miniCaseIconUrgent: { backgroundColor: '#FFF0F0' },
  miniCaseCopy: { flex: 1, gap: 2, minWidth: 0 },
  miniCaseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniCaseTitle: { flex: 1, fontSize: 11.5, fontFamily: 'Montserrat_700Bold', color: INK },
  miniUrgentText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    color: DANGER,
    letterSpacing: 0.4,
  },
  miniCaseMeta: { fontSize: 9.5, fontFamily: 'Montserrat_500Medium', color: MUTED },
  microCasesEmpty: {
    minHeight: 44,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E7EEE8',
  },
  microCasesEmptyText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: MUTED,
  },
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
  attentionSection: {
    borderColor: '#E8E8E3',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9, marginBottom: 13 },
  sectionHeading: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN_SOFT,
  },
  sectionIconUrgent: { backgroundColor: '#FFF0F0' },
  sectionTitleCopy: { flex: 1, minWidth: 0, gap: 2 },
  sectionEyebrow: { fontSize: 8, fontFamily: 'Montserrat_700Bold', color: PRIMARY, letterSpacing: 0.7 },
  sectionEyebrowUrgent: { color: DANGER },
  sectionTitle: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#1C251D', letterSpacing: -0.25 },
  sectionSubtitle: { fontSize: 9.5, fontFamily: 'Montserrat_500Medium', color: MUTED, lineHeight: 14 },
  sectionActionBtn: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3F6F3',
  },
  sectionAction: { fontSize: 9.5, fontFamily: 'Montserrat_700Bold', color: TEXT },
  caseList: { gap: 10 },
  caseCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: 13,
    gap: 9,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
  },
  caseCardUrgent: { borderColor: '#F3D1D1', backgroundColor: '#FFFCFC', paddingLeft: 16 },
  urgentAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: DANGER,
  },
  urgentLeadRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  urgentLead: { fontSize: 8.5, fontFamily: 'Montserrat_700Bold', color: DANGER, letterSpacing: 0.72 },
  caseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  caseInfo: { flex: 1, minWidth: 0, gap: 2 },
  caseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caseTitle: { flex: 1, fontSize: 13, fontFamily: 'Montserrat_700Bold', color: INK },
  caseLocation: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED },
  caseDescription: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: TEXT, lineHeight: 17 },
  statusSurface: {
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#F3F8F4',
    borderWidth: 1,
    borderColor: '#E3ECE5',
  },
  caseActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingTop: 2 },
  casePrimaryAction: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PRIMARY,
  },
  casePrimaryActionText: { fontSize: 10.5, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  caseActionBtn: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F6F3',
    borderWidth: 1,
    borderColor: BORDER,
  },
  caseActionText: { fontSize: 10.5, fontFamily: 'Montserrat_700Bold', color: TEXT },
  emptyCard: {
    minHeight: 116,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F5F8F5',
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5ED',
  },
  emptyTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: INK },
  emptyText: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: MUTED },
  followEmptyCard: {
    minHeight: 172,
    borderRadius: 19,
    paddingHorizontal: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#F6F9F6',
    borderWidth: 1,
    borderColor: '#E2EBE4',
  },
  followEmptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5ED',
  },
  followEmptyTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: INK, textAlign: 'center' },
  followEmptyText: {
    maxWidth: 260,
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: MUTED,
    lineHeight: 16,
    textAlign: 'center',
  },
  exploreBtn: {
    minHeight: 36,
    marginTop: 5,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D5E7D9',
    backgroundColor: '#FFFFFF',
  },
  exploreBtnText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: PRIMARY },
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
