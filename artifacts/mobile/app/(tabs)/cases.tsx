import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUSES = [
  'Novo',
  'Em triagem',
  'Lar temporario',
  'Em tratamento',
  'Disponivel',
  'Adotado',
  'Encerrado',
] as const;

const STATUS_COLORS: Record<string, string> = {
  'Novo': '#3B82F6',
  'Em triagem': '#F59E0B',
  'Lar temporario': '#8B5CF6',
  'Em tratamento': '#EF4444',
  'Disponivel': '#10B981',
  'Adotado': '#6B7280',
  'Encerrado': '#6B7280',
};

function statusForPost(post: Post, index: number) {
  if (post.type === 'emergency' || post.urgent) return index % 2 === 0 ? 'Novo' : 'Em triagem';
  if (post.type === 'adoption') return 'Disponivel';
  if (post.type === 'found') return 'Lar temporario';
  if (post.type === 'campaign') return 'Em tratamento';
  return 'Novo';
}

function statusIcon(status: string): MCIcon {
  const icons: Record<string, MCIcon> = {
    'Novo': 'plus-circle-outline',
    'Em triagem': 'clipboard-search-outline',
    'Lar temporario': 'home-clock-outline',
    'Em tratamento': 'medical-bag',
    'Disponivel': 'home-heart',
    'Adotado': 'check-circle-outline',
    'Encerrado': 'archive-check-outline',
  };
  return icons[status] || 'help-circle-outline';
}

// COMPONENTE DE STATUS TAB COM EFEITO ANIMADO IGUAL COMPOSESCREEN
const AnimatedStatusTab: React.FC<{
  status: string;
  count: number;
  isActive: boolean;
  colors: any;
  onPress: () => void;
}> = ({ status, count, isActive, colors, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const statusColor = STATUS_COLORS[status] || colors.primary;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // MESMO EFEITO do ComposeScreen: scale 0.92 com spring
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 6,
      tension: 400,
    }).start();
  };

  const handlePressOut = () => {
    // MESMO EFEITO do ComposeScreen: volta com spring
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 400,
    }).start();
  };

  const handlePress = () => {
    // Feedback tátil igual ComposeScreen
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.statusTab,
          {
            backgroundColor: isActive ? statusColor : colors.card,
            borderColor: isActive ? statusColor : colors.border,
            ...Platform.select({
              ios: {
                shadowColor: isActive ? statusColor : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.2 : 0.05,
                shadowRadius: 4,
              },
              android: { elevation: isActive ? 2 : 0 },
            }),
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <MaterialCommunityIcons 
          name={statusIcon(status)} 
          size={14} 
          color={isActive ? '#FFFFFF' : statusColor} 
        />
        <Text style={[styles.statusLabel, { color: isActive ? '#FFFFFF' : colors.foreground }]}>
          {status}
        </Text>
        <View style={[
          styles.statusCountBadge,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : statusColor + '15' }
        ]}>
          <Text style={[styles.statusCount, { color: isActive ? '#FFFFFF' : statusColor }]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// BADGE DE STATUS NO CARD (também com animação igual ComposeScreen)
const AnimatedStatusBadge: React.FC<{
  status: string;
  colors: any;
}> = ({ status, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const statusColor = STATUS_COLORS[status] || colors.primary;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 6,
      tension: 400,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 400,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedStatusBadge,
        {
          backgroundColor: statusColor + '15',
          borderColor: statusColor + '30',
          transform: [{ scale: scaleAnim }],
        },
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <MaterialCommunityIcons name={statusIcon(status)} size={11} color={statusColor} />
      <Text style={[styles.animatedStatusText, { color: statusColor }]}>{status}</Text>
    </Animated.View>
  );
};

// BADGE URGENTE COM EFEITO DE PULSO (igual ComposeScreen)
const AnimatedUrgentBadge: React.FC = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Loop de pulso igual ao urgentPulse do ComposeScreen
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedUrgentBadge,
        {
          transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
        },
      ]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <Ionicons name="flash" size={10} color="#FFFFFF" />
      <Text style={styles.animatedUrgentText}>Urgente</Text>
    </Animated.View>
  );
};

// Componente de caso com microfoto
const CaseCard: React.FC<{
  post: Post;
  status: string;
  colors: any;
  onPress: () => void;
  index: number;
}> = ({ post, status, colors, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showOverlay, setShowOverlay] = useState(false);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowOverlay(true);
  };

  const imageUrl = post.image || `https://picsum.photos/id/${100 + index}/200/200`;

  return (
    <>
      <Animated.View
        style={[
          styles.caseCardWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={300}
        >
          <View style={[styles.caseCard, { backgroundColor: colors.card }]}>
            <Image source={{ uri: imageUrl }} style={styles.microPhoto} />
            
            <View style={styles.caseBody}>
              <View style={styles.caseTop}>
                <Text style={[styles.caseTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {post.name || 'Sem nome'}
                </Text>
                <View style={styles.badgeRow}>
                  <AnimatedStatusBadge status={status} colors={colors} />
                  {post.urgent && <AnimatedUrgentBadge />}
                </View>
              </View>

              <Text style={[styles.caseDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                {post.description || 'Nenhuma descrição fornecida.'}
              </Text>

              <View style={styles.caseMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.caseMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {post.location || 'Local não informado'}
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.caseMeta, { color: colors.mutedForeground }]}>
                    {post.createdAt || 'Hoje'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: status === 'Novo' ? '20%' : 
                             status === 'Em triagem' ? '40%' : 
                             status === 'Lar temporario' ? '60%' : 
                             status === 'Em tratamento' ? '80%' : '100%',
                      backgroundColor: STATUS_COLORS[status] || colors.primary
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showOverlay}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOverlay(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowOverlay(false)}>
          <Animated.View style={[styles.overlayCard, { backgroundColor: colors.card }]}>
            <View style={styles.overlayHeader}>
              <Image source={{ uri: imageUrl }} style={styles.overlayImage} />
              <Text style={[styles.overlayTitle, { color: colors.foreground }]}>
                {post.name || 'Caso'}
              </Text>
            </View>
            <View style={styles.overlayActions}>
              <TouchableOpacity 
                style={[styles.overlayAction, { backgroundColor: colors.primary + '10' }]}
                onPress={() => {
                  setShowOverlay(false);
                  onPress();
                }}
              >
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
                <Text style={[styles.overlayActionText, { color: colors.primary }]}>Ver detalhes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.overlayAction, { backgroundColor: '#3B82F610' }]}
                onPress={() => setShowOverlay(false)}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
                <Text style={[styles.overlayActionText, { color: '#3B82F6' }]}>Conversar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.overlayAction, { backgroundColor: '#EF444410' }]}
                onPress={() => setShowOverlay(false)}
              >
                <Ionicons name="share-outline" size={20} color="#EF4444" />
                <Text style={[styles.overlayActionText, { color: '#EF4444' }]}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.overlayClose}
              onPress={() => setShowOverlay(false)}
            >
              <Text style={[styles.overlayCloseText, { color: colors.mutedForeground }]}>Fechar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

// Dica do dia
const TipOfDay: React.FC<{ colors: any }> = ({ colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 5 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  return (
    <Animated.View style={[styles.tipCard, { transform: [{ scale: scaleAnim }], backgroundColor: colors.card }]}>
      <TouchableOpacity 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.tipHeader}>
          <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="bulb-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>Dica de hoje</Text>
        </View>
        <Text style={[styles.tipText, { color: colors.foreground }]}>
          Cães precisam de água fresca disponível o dia todo. Troque a água pelo menos 3 vezes ao dia.
        </Text>
        <View style={styles.tipMeta}>
          <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.tipLocation, { color: colors.mutedForeground }]}>São Paulo, SP</Text>
          <Text style={[styles.tipTime, { color: colors.mutedForeground }]}>· 1h atrás</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function OngCasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts } = useApp();
  const [activeStatus, setActiveStatus] = useState<(typeof STATUSES)[number]>('Novo');
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const cases = useMemo(
    () => posts.map((post, index) => ({ post, status: statusForPost(post, index) })),
    [posts],
  );
  
  const filteredCases = cases.filter((item) => item.status === activeStatus);
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUSES.forEach(s => { counts[s] = 0; });
    cases.forEach(({ status }) => { counts[status] = (counts[status] || 0) + 1; });
    return counts;
  }, [cases]);

  const handleStatusChange = (status: typeof STATUSES[number]) => {
    setActiveStatus(status);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { paddingTop: topPad + 12, opacity: headerOpacity }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>Gestão de casos</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Casos da ONG</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/compose')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statusTabs}
          decelerationRate="fast"
        >
          {STATUSES.map((status) => {
            const count = statusCounts[status] || 0;
            const isActive = activeStatus === status;
            
            return (
              <AnimatedStatusTab
                key={status}
                status={status}
                count={count}
                isActive={isActive}
                colors={colors}
                onPress={() => handleStatusChange(status)}
              />
            );
          })}
        </ScrollView>

        <View style={[styles.list, { paddingBottom: bottomPad + 84 }]}>
          {filteredCases.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '10' }]}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={42} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum caso aqui</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Quando um caso entrar no status "{activeStatus}", ele aparecerá nesta lista.
              </Text>
            </View>
          ) : (
            <>
              {filteredCases.map(({ post, status }, idx) => (
                <CaseCard
                  key={post.id}
                  post={post}
                  status={status}
                  colors={colors}
                  index={idx}
                  onPress={() => router.push(`/post/${post.id}`)}
                />
              ))}
              <TipOfDay colors={colors} />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  
  statusTabs: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 20,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    minWidth: 28,
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  
  caseCardWrapper: {
    marginBottom: 0,
  },
  caseCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  microPhoto: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
  },
  caseBody: {
    flex: 1,
    gap: 8,
  },
  caseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animatedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  animatedStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  animatedUrgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  animatedUrgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  caseDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  caseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
  caseMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  tipCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipLocation: {
    fontSize: 11,
    fontWeight: '500',
  },
  tipTime: {
    fontSize: 11,
  },
  
  emptyCard: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 28,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
      },
      android: { elevation: 12 },
    }),
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  overlayImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  overlayActions: {
    gap: 10,
  },
  overlayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  overlayActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  overlayClose: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  overlayCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});