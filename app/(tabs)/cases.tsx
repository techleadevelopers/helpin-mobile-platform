import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OperationalStatus } from '@/components/OperationalStatus';
import { StatusBadge } from '@/components/StatusBadge';
import { ZooHelpHeader } from '@/components/ZooHelpHeader';
import type { Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type CaseStatus = 'Novo' | 'Em triagem' | 'Lar temporario' | 'Em tratamento' | 'Disponivel' | 'Adotado' | 'Encerrado';

const PRIMARY = '#2D6A4F';
const INK = '#18231B';
const TEXT = '#3D473F';
const MUTED = '#7C867C';
const MUTED_2 = '#8A928B';
const BG = '#F7F8F4';
const CARD = '#FFFFFF';
const CHIP = '#F4F6F3';
const GREEN_SOFT = '#EAF7EF';
const BORDER = '#E4EAE5';
const BORDER_SOFT = '#E8EDE8';
const DANGER = '#C95A5A';

const STATUSES: Array<{ value: CaseStatus; icon: MCIcon; color: string }> = [
  { value: 'Novo', icon: 'plus-circle-outline', color: '#3B82F6' },
  { value: 'Em triagem', icon: 'clipboard-search-outline', color: '#D4A259' },
  { value: 'Lar temporario', icon: 'home-clock-outline', color: '#8B5CF6' },
  { value: 'Em tratamento', icon: 'medical-bag', color: DANGER },
  { value: 'Disponivel', icon: 'home-heart', color: PRIMARY },
  { value: 'Adotado', icon: 'check-circle-outline', color: '#6D766F' },
  { value: 'Encerrado', icon: 'archive-check-outline', color: '#6D766F' },
];

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

function statusForPost(post: Post): CaseStatus {
  if (isResolved(post)) return 'Encerrado';
  if (isOperationalCase(post)) return 'Novo';
  if (post.type === 'adoption') return 'Disponivel';
  if (post.type === 'found') return 'Lar temporario';
  if (post.type === 'campaign') return 'Em tratamento';
  return 'Novo';
}

function progressForStatus(status: CaseStatus): `${number}%` {
  const values: Record<CaseStatus, `${number}%`> = {
    Novo: '20%',
    'Em triagem': '38%',
    'Lar temporario': '56%',
    'Em tratamento': '74%',
    Disponivel: '82%',
    Adotado: '100%',
    Encerrado: '100%',
  };
  return values[status];
}

function statusConfig(status: CaseStatus) {
  return STATUSES.find((item) => item.value === status) ?? STATUSES[0];
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.eyebrow}>{subtitle}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function CaseCard({
  post,
  status,
  index,
  onOpen,
  onChat,
  onMap,
  onMore,
}: {
  post: Post;
  status: CaseStatus;
  index: number;
  onOpen: () => void;
  onChat: () => void;
  onMap: () => void;
  onMore: () => void;
}) {
  const config = statusConfig(status);
  const imageUrl = post.image || `https://picsum.photos/id/${112 + index}/240/240`;
  const urgent = post.urgent || post.type === 'emergency';

  return (
    <TouchableOpacity style={styles.caseCard} onPress={onOpen} onLongPress={onMore} activeOpacity={0.9}>
      <View style={styles.caseTop}>
        <Image source={{ uri: imageUrl }} style={styles.caseImage} contentFit="cover" />
        <View style={styles.caseMain}>
          <View style={styles.caseTitleRow}>
            <Text style={styles.caseTitle} numberOfLines={1}>{post.name || 'Caso sem nome'}</Text>
            <View style={[styles.caseStatusPill, { backgroundColor: `${config.color}14`, borderColor: `${config.color}30` }]}>
              <MaterialCommunityIcons name={config.icon} size={11} color={config.color} />
              <Text style={[styles.caseStatusText, { color: config.color }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.caseDescription} numberOfLines={2}>
            {post.description || 'Caso aguardando atualização da ONG.'}
          </Text>
          <View style={styles.caseMetaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={12} color={MUTED} />
            <Text style={styles.caseMeta} numberOfLines={1}>{post.neighborhood || post.location || 'Local nao informado'}</Text>
          </View>
        </View>
      </View>

      <OperationalStatus post={post} variant="compact" />

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressForStatus(status), backgroundColor: config.color }]} />
      </View>

      <View style={styles.caseFooter}>
        <View style={styles.footerBadges}>
          <StatusBadge type={post.type} urgent={urgent && !isResolved(post)} resolved={isResolved(post)} size="xs" hideType />
          {urgent && !isResolved(post) && (
            <View style={styles.urgentPill}>
              <MaterialCommunityIcons name="flash-outline" size={11} color="#FFFFFF" />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          )}
        </View>
        <View style={styles.caseActions}>
          <TouchableOpacity style={styles.caseAction} onPress={onChat} activeOpacity={0.82}>
            <MaterialCommunityIcons name="chat-outline" size={14} color={PRIMARY} />
            <Text style={styles.caseActionText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.caseAction} onPress={onMap} activeOpacity={0.82}>
            <MaterialCommunityIcons name="map-outline" size={14} color={PRIMARY} />
            <Text style={styles.caseActionText}>Mapa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TipCard() {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={styles.tipIcon}>
          <MaterialCommunityIcons name="lightbulb-outline" size={22} color={PRIMARY} />
        </View>
        <Text style={styles.tipTitle}>Dica de hoje</Text>
      </View>
      <Text style={styles.tipText}>Caes precisam de agua fresca disponivel o dia todo. Troque a agua pelo menos 3 vezes ao dia.</Text>
      <View style={styles.tipMeta}>
        <MaterialCommunityIcons name="map-marker-outline" size={12} color={MUTED} />
        <Text style={styles.tipMetaText}>Sao Paulo, SP · 1h atras</Text>
      </View>
    </View>
  );
}

function EmptyState({ activeStatus }: { activeStatus: CaseStatus }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={PRIMARY} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum caso aqui</Text>
      <Text style={styles.emptyText}>Quando um caso entrar em "{activeStatus}", ele aparece nesta lista.</Text>
    </View>
  );
}

export default function OngCasesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, refreshPosts, user } = useApp();
  const [activeStatus, setActiveStatus] = useState<CaseStatus>('Novo');
  const [selectedCase, setSelectedCase] = useState<{ post: Post; status: CaseStatus } | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const cases = useMemo(
    () => posts.map((post) => ({ post, status: statusForPost(post) })),
    [posts],
  );

  useFocusEffect(
    useCallback(() => {
      refreshPosts().catch(() => {});
    }, [refreshPosts])
  );

  const ownCases = useMemo(
    () => user?.type === 'ong' ? cases.filter(({ post }) => post.author.id === user.id || isOperationalCase(post)) : cases,
    [cases, user?.id, user?.type],
  );

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((item) => [item.value, 0])) as Record<CaseStatus, number>;
    ownCases.forEach(({ status }) => {
      counts[status] += 1;
    });
    return counts;
  }, [ownCases]);

  const filteredCases = ownCases
    .filter((item) => item.status === activeStatus)
    .sort((a, b) => Number(isOperationalCase(b.post)) - Number(isOperationalCase(a.post)));
  const activeCount = ownCases.filter(({ post }) => !isResolved(post)).length;
  const urgentCount = ownCases.filter(({ post }) => isOperationalCase(post)).length;
  const activeStatusConfig = statusConfig(activeStatus);

  function push(route: string) {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  }

  return (
    <View style={styles.container}>
      <ZooHelpHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 92 }]}>
        <View style={styles.headerBlock}>
          <SectionTitle title="Casos da ONG" subtitle="Gestao de casos" />
          <TouchableOpacity style={styles.addButton} onPress={() => push('/composer')} activeOpacity={0.84}>
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{ownCases.length}</Text>
            <Text style={styles.summaryLabel}>total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: DANGER }]}>{urgentCount}</Text>
            <Text style={styles.summaryLabel}>urgentes</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: PRIMARY }]}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>ativos</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)} activeOpacity={0.84}>
          <View style={[styles.filterIcon, { backgroundColor: `${activeStatusConfig.color}14` }]}>
            <MaterialCommunityIcons name="filter-variant" size={17} color={activeStatusConfig.color} />
          </View>
          <View style={styles.filterCopy}>
            <Text style={styles.filterEyebrow}>Filtro de status</Text>
            <Text style={styles.filterValue}>{activeStatus}</Text>
          </View>
          <View style={styles.filterCount}>
            <Text style={styles.filterCountText}>{statusCounts[activeStatus]}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={18} color={MUTED} />
        </TouchableOpacity>

        <View style={styles.list}>
          {filteredCases.length > 0 ? (
            filteredCases.map(({ post, status }, index) => (
              <CaseCard
                key={post.id}
                post={post}
                status={status}
                index={index}
                onOpen={() => push(`/post/${post.id}`)}
                onChat={() => push('/(tabs)/chat')}
                onMap={() => push('/(tabs)/map')}
                onMore={() => setSelectedCase({ post, status })}
              />
            ))
          ) : (
            <EmptyState activeStatus={activeStatus} />
          )}
          <TipCard />
        </View>
      </ScrollView>

      <Modal transparent visible={selectedCase !== null} animationType="fade" onRequestClose={() => setSelectedCase(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedCase(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle} numberOfLines={1}>{selectedCase?.post.name || 'Caso'}</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={2}>{selectedCase?.post.description}</Text>
            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => {
                const id = selectedCase?.post.id;
                setSelectedCase(null);
                if (id) push(`/post/${id}`);
              }}
              activeOpacity={0.84}
            >
              <MaterialCommunityIcons name="eye-outline" size={18} color={PRIMARY} />
              <Text style={styles.sheetActionText}>Ver detalhes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => {
                setSelectedCase(null);
                push('/(tabs)/chat');
              }}
              activeOpacity={0.84}
            >
              <MaterialCommunityIcons name="chat-outline" size={18} color={PRIMARY} />
              <Text style={styles.sheetActionText}>Abrir chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetClose} onPress={() => setSelectedCase(null)} activeOpacity={0.82}>
              <Text style={styles.sheetCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={filterVisible} animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEyebrow}>FILTROS</Text>
            <Text style={styles.sheetTitle}>Status dos casos</Text>
            <Text style={styles.sheetSubtitle}>Escolha quais casos deseja acompanhar agora.</Text>
            <View style={styles.filterOptions}>
              {STATUSES.map((item) => {
                const isActive = activeStatus === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.filterOption, isActive && { borderColor: item.color, backgroundColor: `${item.color}12` }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveStatus(item.value);
                      setFilterVisible(false);
                    }}
                    activeOpacity={0.84}
                  >
                    <View style={[styles.filterOptionIcon, { backgroundColor: `${item.color}14` }]}>
                      <MaterialCommunityIcons name={item.icon} size={16} color={item.color} />
                    </View>
                    <Text style={[styles.filterOptionText, isActive && { color: item.color }]}>{item.value}</Text>
                    <View style={styles.filterOptionCount}>
                      <Text style={styles.filterOptionCountText}>{statusCounts[item.value]}</Text>
                    </View>
                    {isActive && <MaterialCommunityIcons name="check-circle" size={17} color={item.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 18, gap: 14 },
  headerBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: 3 },
  eyebrow: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: MUTED },
  title: { fontSize: 25, fontFamily: 'Montserrat_700Bold', color: '#1C251D', letterSpacing: -0.5 },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#586158',
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
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
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 18, fontFamily: 'Montserrat_700Bold', color: INK },
  summaryLabel: { fontSize: 10, fontFamily: 'Montserrat_500Medium', color: MUTED },
  summaryDivider: { width: 1, height: 34, backgroundColor: BORDER },
  filterButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: CARD,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 1,
  },
  filterIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCopy: { flex: 1, gap: 1 },
  filterEyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: MUTED,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  filterValue: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: INK,
  },
  filterCount: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: GREEN_SOFT,
  },
  filterCountText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: PRIMARY },
  list: { gap: 12 },
  caseCard: {
    padding: 14,
    gap: 10,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  caseTop: { flexDirection: 'row', gap: 12 },
  caseImage: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#E8ECF0' },
  caseMain: { flex: 1, minWidth: 0, gap: 5 },
  caseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caseTitle: { flex: 1, fontSize: 15, fontFamily: 'Montserrat_700Bold', color: INK },
  caseStatusPill: {
    minHeight: 25,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caseStatusText: { fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  caseDescription: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: TEXT, lineHeight: 17 },
  caseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  caseMeta: { flex: 1, fontSize: 10.5, fontFamily: 'Montserrat_500Medium', color: MUTED },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: '#E5EAE6', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  caseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  footerBadges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  urgentPill: {
    minHeight: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DANGER,
  },
  urgentText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#FFFFFF' },
  caseActions: { flexDirection: 'row', gap: 6 },
  caseAction: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CHIP,
    borderWidth: 1,
    borderColor: BORDER,
  },
  caseActionText: { fontSize: 10.5, fontFamily: 'Montserrat_700Bold', color: TEXT },
  tipCard: {
    borderRadius: 22,
    padding: 16,
    gap: 11,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    shadowColor: '#172018',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_SOFT },
  tipTitle: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: INK },
  tipText: { fontSize: 13, fontFamily: 'Montserrat_500Medium', color: TEXT, lineHeight: 19 },
  tipMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tipMetaText: { fontSize: 11, fontFamily: 'Montserrat_500Medium', color: MUTED },
  emptyCard: {
    minHeight: 176,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  emptyIcon: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_SOFT },
  emptyTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: INK },
  emptyText: { maxWidth: 250, textAlign: 'center', fontSize: 12, fontFamily: 'Montserrat_500Medium', color: MUTED, lineHeight: 18 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,28,22,0.28)' },
  sheet: {
    margin: 10,
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#E6ECE7',
    gap: 10,
  },
  sheetHandle: { alignSelf: 'center', width: 34, height: 4, borderRadius: 2, backgroundColor: '#DDE5DF', marginBottom: 4 },
  sheetTitle: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: INK },
  sheetSubtitle: { fontSize: 12, fontFamily: 'Montserrat_500Medium', color: MUTED, lineHeight: 18 },
  sheetEyebrow: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: MUTED,
    letterSpacing: 0.7,
  },
  filterOptions: { gap: 8 },
  filterOption: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: '#F8FAF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
  },
  filterOptionIcon: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: INK,
  },
  filterOptionCount: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    backgroundColor: '#FFFFFF',
  },
  filterOptionCountText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: MUTED,
  },
  sheetAction: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: CHIP,
  },
  sheetActionText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: TEXT },
  sheetClose: { alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  sheetCloseText: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: MUTED_2 },
});
