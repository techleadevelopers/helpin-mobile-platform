import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Image,
  ImageStyle,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOCK_CONVERSATIONS, Post } from '@/constants/data';
import { useApp } from '@/context/AppContext';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IonIcon = React.ComponentProps<typeof Ionicons>['name'];

const WHITE = '#FFFFFF';
const BACKGROUND_ALT = '#F8F9FD';
const TEXT_DARK = '#1A2538';
const TEXT_MEDIUM = '#4A5568';
const TEXT_MUTED = '#7A8599';
const ICON_PRIMARY = '#464b49';
const SUCCESS_GREEN = '#28A745';
const DANGER_RED = '#f5493d';
const WARNING_YELLOW = '#F59E0B';
const BORDER_SUBTLE = 'rgba(0,0,0,0.08)';
const SHADOW_COLOR_CARD = 'rgba(0, 0, 0, 0.08)';
const SHADOW_COLOR_SECTION = 'rgba(0, 0, 0, 0.1)';
const GREEN_SOFT = 'rgba(45, 106, 79, 0.12)';

const Spacing = {
  xs: 6,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 28,
};

const Radii = {
  xl: 20,
  pill: 25,
  md: 12,
  sm: 10,
};

// Dados com micro fotos reais
const FALLBACK_RESCUES = [
  {
    id: 'rescue-1',
    name: 'Thor',
    location: 'Ibirapuera',
    description: 'Thor fugiu no Parque Ibirapuera. Tem coleira azul e microchip.',
    image: 'https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg',
    urgent: true,
    volunteers: 3,
    time: '1 dia atrás',
  },
  {
    id: 'rescue-2',
    name: 'Sem nome',
    location: 'Bela Vista',
    description: 'Gatinho encontrado ferido na Av. Paulista. Precisa de atendimento veterinário urgente.',
    image: 'https://cdn2.thecatapi.com/images/MTY5ODQzMw.jpg',
    urgent: true,
    volunteers: 4,
    time: '45min atrás',
  },
];

const ADOPTION_QUEUE = [
  { id: 'adoption-1', name: 'Mel', time: 'Hoje', location: 'Pinheiros' },
  { id: 'adoption-2', name: 'Bolt', time: 'Amanha', location: 'Mooca' },
];

const useAnimatedTouch = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 40,
    }).start();
  };

  return { scaleAnim, onPressIn, onPressOut };
};

const useReducedMotion = () => {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    const updateReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsReducedMotionEnabled(enabled);
    };
    updateReducedMotion();
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotionEnabled,
    );
    return () => subscription.remove();
  }, []);

  return isReducedMotionEnabled;
};

const DashboardHeader: React.FC<{
  ongName: string | undefined;
  avatarUrl: string | undefined | null;
  verificationLabel: string;
  isPendingReview: boolean;
  activeCases: number;
  unreadMessages: number;
  donationTotal: number;
  onAvatarPress: () => void;
}> = ({
  ongName,
  avatarUrl,
  verificationLabel,
  isPendingReview,
  activeCases,
  unreadMessages,
  donationTotal,
  onAvatarPress,
}) => {
  const insets = useSafeAreaInsets();
  const { scaleAnim, onPressIn, onPressOut } = useAnimatedTouch();
  const paddingTopValue = insets.top + (Platform.OS === 'ios' ? 12 : 10);
  const formattedDonations = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(donationTotal);

  return (
    <Animated.View style={[headerStyles.headerContainer, { paddingTop: paddingTopValue }]}>
      <View style={headerStyles.avatarColumn}>
        <TouchableOpacity
          onPress={onAvatarPress}
          style={[headerStyles.avatarButton, { transform: [{ scale: scaleAnim }] }]}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel="Alterar logo da ONG"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={headerStyles.avatar} />
          ) : (
            <View style={headerStyles.avatarPlaceholder}>
              <Ionicons name="image-outline" size={23} color={ICON_PRIMARY} />
            </View>
          )}
          <View style={headerStyles.avatarEditBadge}>
            <Ionicons name="camera" size={11} color={WHITE} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={headerStyles.greetingContainer}>
        <Text style={headerStyles.greetingText}>ONG</Text>
        <Text style={headerStyles.providerNameText} numberOfLines={1}>
          {ongName || 'Instituto Resgate'}
        </Text>
        <View style={headerStyles.statusLine}>
          <Ionicons
            name={isPendingReview ? 'time-outline' : 'shield-checkmark-outline'}
            size={14}
            color={isPendingReview ? WARNING_YELLOW : ICON_PRIMARY}
          />
          <Text style={[headerStyles.currentDateText, isPendingReview && headerStyles.pendingText]}>
            SP - {verificationLabel} - {activeCases} ativos
          </Text>
        </View>

        <View style={headerStyles.metricsRow}>
          <View style={headerStyles.metricBlock}>
            <Text style={headerStyles.metricLabel}>Alertas</Text>
            <Text style={[headerStyles.metricValue, activeCases > 0 && { color: DANGER_RED }]}>
              {activeCases}
            </Text>
          </View>
          <View style={headerStyles.metricDivider} />
          <View style={headerStyles.metricBlock}>
            <Text style={headerStyles.metricLabel}>Chat</Text>
            <Text style={headerStyles.metricValue}>{unreadMessages}</Text>
          </View>
          <View style={headerStyles.metricDivider} />
          <View style={headerStyles.metricBlock}>
            <Text style={headerStyles.metricLabel}>Doacoes</Text>
            <Text style={headerStyles.metricValue}>{formattedDonations}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

type ShortcutLabels = {
  rescue?: string;
  adoption?: string;
  updates?: string;
  cases?: string;
  chat?: string;
  donations?: string;
  map?: string;
  marketplace?: string;
  boost?: string;
  primary?: string;
  secondary?: string;
};

const ShortcutsGrid: React.FC<{
  onOpenRescue: () => void;
  onOpenAdoption: () => void;
  onOpenUpdates: () => void;
  onOpenCases: () => void;
  onOpenChat: () => void;
  onOpenDonations: () => void;
  onOpenMap: () => void;
  onOpenMarketplace: () => void;
  onOpenBoost: () => void;
  animation: Animated.Value;
  isReducedMotionEnabled: boolean;
  labels?: ShortcutLabels;
  itemStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
  labelStyle?: StyleProp<TextStyle>;
}> = ({
  onOpenRescue,
  onOpenAdoption,
  onOpenUpdates,
  onOpenCases,
  onOpenChat,
  onOpenDonations,
  onOpenMap,
  onOpenMarketplace,
  onOpenBoost,
  animation,
  isReducedMotionEnabled,
  labels = {},
  itemStyle,
  iconSize = 22,
  labelStyle,
}) => {
  const touchAnimations = [
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
    useAnimatedTouch(),
  ];

  const shortcutItems: { icon: IonIcon; label: string; onPress: () => void }[] = [
    { icon: 'alert-circle', label: labels.rescue ?? 'Resgate', onPress: onOpenRescue },
    { icon: 'home', label: labels.adoption ?? 'Adocao', onPress: onOpenAdoption },
    { icon: 'megaphone', label: labels.updates ?? 'Atualizar', onPress: onOpenUpdates },
    { icon: 'folder-open', label: labels.cases ?? 'Casos', onPress: onOpenCases },
    { icon: 'chatbubbles', label: labels.chat ?? 'Chat', onPress: onOpenChat },
    { icon: 'wallet', label: labels.donations ?? 'Doacoes', onPress: onOpenDonations },
    { icon: 'map', label: labels.map ?? 'Mapa', onPress: onOpenMap },
    { icon: 'basket', label: labels.marketplace ?? 'Bazar', onPress: onOpenMarketplace },
    { icon: 'trending-up', label: labels.boost ?? 'Boost', onPress: onOpenBoost },
  ];

  const ActionItem = ({
    icon,
    label,
    anim,
    onPress,
  }: {
    icon: IonIcon;
    label: string;
    anim: ReturnType<typeof useAnimatedTouch>;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[quickActionStyles.gridItem, itemStyle, { transform: [{ scale: anim.scaleAnim }] }]}
      onPress={() => {
        if (!isReducedMotionEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onPressIn={anim.onPressIn}
      onPressOut={anim.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={quickActionStyles.iconAccent}>
        <Ionicons name={icon} size={iconSize} color={ICON_PRIMARY} />
      </View>
      <Text style={[quickActionStyles.gridItemText, labelStyle]} numberOfLines={1} allowFontScaling={false}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        quickActionStyles.sectionContainer,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[quickActionStyles.scrollRow, { paddingHorizontal: Spacing.sm }]}
      >
        {shortcutItems.map((shortcut, index) => (
          <ActionItem
            key={shortcut.label}
            icon={shortcut.icon}
            label={shortcut.label}
            anim={touchAnimations[index]}
            onPress={shortcut.onPress}
          />
        ))}
      </ScrollView>

      <View style={quickActionStyles.ctaRow}>
        <TouchableOpacity
          style={quickActionStyles.primaryCta}
          onPress={onOpenRescue}
          accessibilityRole="button"
          accessibilityLabel={labels.primary ?? 'Novo resgate'}
        >
          <Ionicons name="add-circle" size={20} color={WHITE} />
          <Text style={quickActionStyles.primaryCtaText}>{labels.primary ?? 'Novo resgate'}</Text>
          <Ionicons name="chevron-forward-outline" size={18} color={WHITE} />
        </TouchableOpacity>
        <TouchableOpacity
          style={quickActionStyles.secondaryCta}
          onPress={onOpenAdoption}
          accessibilityRole="button"
          accessibilityLabel={labels.secondary ?? 'Publicar adocao'}
        >
          <Ionicons name="home-outline" size={18} color={WHITE} />
          <Text style={quickActionStyles.secondaryCtaText}>{labels.secondary ?? 'Adocao'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// COMPONENTE PRINCIPAL COM MICRO FOTO (CORRIGIDO)
const RequestItem: React.FC<{
  item: ReturnType<typeof normalizeRescueItem>;
  onDetails: () => void;
  onMap: () => void;
  onChat: () => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
  disabled?: boolean;
}> = ({ item, onDetails, onMap, onChat, entryAnim, isReducedMotionEnabled, disabled }) => {
  const detailsTouchAnimation = useAnimatedTouch();
  const mapTouchAnimation = useAnimatedTouch();
  const chatTouchAnimation = useAnimatedTouch();

  return (
    <Animated.View
      style={[
        styles.requestItem,
        item.urgent && styles.requestItemUrgent,
        {
          opacity: entryAnim,
          transform: [
            {
              translateY: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.requestRowWithPhoto}>
        {/* ✅ MICRO FOTO - SÓ URL, SEM REQUIRE BURRO */}
        <Image 
          source={{ uri: item.image }} 
          style={styles.microPhoto}
        />

        <View style={styles.requestContent}>
          <View style={styles.requestItemHeader}>
            <View style={styles.requestTitleWrap}>
              <Text style={styles.requestServiceName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.requestLocation} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
            {item.urgent && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Urgente</Text>
              </View>
            )}
          </View>

          <Text style={styles.requestClientName}>{item.description}</Text>

          <View style={styles.requestInfoRow}>
            <Ionicons name="people-outline" size={15} color={TEXT_MUTED} style={styles.infoIcon} />
            <Text style={styles.requestInfoText}>{item.volunteers} voluntarios proximos</Text>
            <Ionicons name="time-outline" size={15} color={TEXT_MUTED} style={styles.infoIcon} />
            <Text style={styles.requestInfoText}>{item.time}</Text>
          </View>

          <View style={styles.requestActionsCompact}>
            <TouchableOpacity
              style={styles.compactActionChip}
              onPress={() => {
                if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDetails();
              }}
              onPressIn={detailsTouchAnimation.onPressIn}
              onPressOut={detailsTouchAnimation.onPressOut}
            >
              <Animated.View style={[styles.compactActionContent, { transform: [{ scale: detailsTouchAnimation.scaleAnim }] }]}>
                <Ionicons name="eye-outline" size={15} color={ICON_PRIMARY} />
                <Text style={styles.compactActionText}>Detalhes</Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.compactActionChip}
              onPress={() => {
                if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChat();
              }}
              onPressIn={chatTouchAnimation.onPressIn}
              onPressOut={chatTouchAnimation.onPressOut}
            >
              <Animated.View style={[styles.compactActionContent, { transform: [{ scale: chatTouchAnimation.scaleAnim }] }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={15} color={ICON_PRIMARY} />
                <Text style={styles.compactActionText}>Chat</Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactActionChip, styles.mapActionChip]}
              onPress={onMap}
              onPressIn={mapTouchAnimation.onPressIn}
              onPressOut={mapTouchAnimation.onPressOut}
            >
              <Animated.View style={[styles.compactActionContent, { transform: [{ scale: mapTouchAnimation.scaleAnim }] }]}>
                <Ionicons name="map-outline" size={15} color={ICON_PRIMARY} />
                <Text style={styles.compactActionText}>Mapa</Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.compactStatusChip, disabled && styles.disabledButton]}
              onPress={onDetails}
              disabled={disabled}
            >
              <View style={styles.compactActionContent}>
                <Ionicons name={disabled ? 'time-outline' : 'checkmark'} size={14} color={WHITE} />
                <Text style={styles.compactStatusText}>{disabled ? 'Analise' : 'Acionar'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const ConfirmedCaseItem: React.FC<{
  item: { id: string; name: string; time: string; location: string };
  onPress: () => void;
  entryAnim: Animated.Value;
  isReducedMotionEnabled: boolean;
}> = ({ item, onPress, entryAnim, isReducedMotionEnabled }) => {
  const touchAnimation = useAnimatedTouch();

  return (
    <Animated.View
      style={{
        opacity: entryAnim,
        transform: [
          {
            translateY: entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={styles.serviceItem}
        onPress={() => {
          if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={touchAnimation.onPressIn}
        onPressOut={touchAnimation.onPressOut}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.serviceItemContent, { transform: [{ scale: touchAnimation.scaleAnim }] }]}>
          <View style={styles.serviceItemIconWrapper}>
            <MaterialCommunityIcons name="home-heart" size={26} color={ICON_PRIMARY} />
          </View>
          <View style={styles.serviceItemDetails}>
            <Text style={styles.serviceItemText} numberOfLines={1}>
              {item.name} em acompanhamento
            </Text>
            <Text style={styles.serviceItemTime}>
              {item.location} - {item.time}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={24} color={TEXT_MUTED} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

function normalizeRescueItem(post: Post | (typeof FALLBACK_RESCUES)[number], index = 0) {
  if ('type' in post) {
    return {
      id: post.id,
      name: post.name || 'Caso sem nome',
      location: post.neighborhood || post.location || 'Regiao proxima',
      description: post.description || 'Caso aguardando acao da ONG.',
      image: post.image || `https://picsum.photos/id/${237 + index}/240/240`,
      urgent: post.type === 'emergency' || post.urgent,
      volunteers: 3 + index,
      time: post.createdAt || 'agora',
    };
  }
  return post;
}

export function OngDashboard() {
  const router = useRouter();
  const { posts, refreshPosts, refreshUser, user } = useApp();
  const isReducedMotionEnabled = useReducedMotion();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading] = useState(false);

  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const requestsAnim = useRef(new Animated.Value(0)).current;
  const upcomingAnim = useRef(new Animated.Value(0)).current;
  const networkAnim = useRef(new Animated.Value(0)).current;
  const activeAnim = useRef(new Animated.Value(0)).current;

  const urgentRescues = useMemo(() => {
    const source = posts.filter((post) => post.type === 'emergency' || post.urgent).slice(0, 2);
    return (source.length > 0 ? source : FALLBACK_RESCUES).map((item, idx) => normalizeRescueItem(item, idx));
  }, [posts]);

  const adoptionQueue = useMemo(() => {
    const source = posts.filter((post) => post.type === 'adoption').slice(0, 2);
    return source.length > 0
      ? source.map((post) => ({
          id: post.id,
          name: post.name || 'Animal',
          time: post.createdAt || 'Hoje',
          location: post.neighborhood || post.location || 'ZooHelp',
        }))
      : ADOPTION_QUEUE;
  }, [posts]);

  const unreadMessages = MOCK_CONVERSATIONS.reduce((sum, item) => sum + item.unread, 0);
  const isPendingReview = user?.type === 'ong' && !user?.verified;
  const verificationLabel =
    user?.verificationStatus === 'REJECTED'
      ? 'Revisao solicitada'
      : isPendingReview
        ? 'Em analise'
        : 'Verificada';

  const activeCases = urgentRescues.length + adoptionQueue.length;
  const donationTotal = 1240;
  const avatarUrl = (user as { avatar?: string; avatarUrl?: string } | null | undefined)?.avatarUrl
    || (user as { avatar?: string; avatarUrl?: string } | null | undefined)?.avatar;

  useEffect(() => {
    const animationDuration = isReducedMotionEnabled ? 0 : 300;
    const staggerDelay = isReducedMotionEnabled ? 0 : 100;
    Animated.stagger(staggerDelay, [
      Animated.timing(quickActionsAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
      Animated.timing(requestsAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
      Animated.timing(upcomingAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
      Animated.timing(networkAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
      Animated.timing(activeAnim, { toValue: 1, duration: animationDuration, useNativeDriver: true }),
    ]).start();
  }, [activeAnim, isReducedMotionEnabled, networkAnim, quickActionsAnim, requestsAnim, upcomingAnim]);

  const push = (href: Href) => router.push(href);

  const onRefresh = async () => {
    if (!isReducedMotionEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    try {
      await Promise.all([refreshUser(), refreshPosts()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={ICON_PRIMARY} accessibilityLabel="Carregando painel da ONG" />
        <Text style={styles.loadingText}>Carregando painel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ICON_PRIMARY}
            accessibilityLabel="Atualizar painel da ONG"
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <DashboardHeader
          ongName={user?.name}
          avatarUrl={avatarUrl}
          verificationLabel={verificationLabel}
          isPendingReview={isPendingReview}
          activeCases={activeCases}
          unreadMessages={unreadMessages}
          donationTotal={donationTotal}
          onAvatarPress={() => push('/(tabs)/profile')}
        />

        <View style={quickActionStyles.shortcutsContainer}>
          <ShortcutsGrid
            labels={{
              rescue: 'Resgate',
              adoption: 'Adocao',
              updates: 'Atualizar',
              cases: 'Casos',
              chat: 'Chat',
              donations: 'Doacoes',
              map: 'Mapa',
              marketplace: 'Bazar',
              boost: 'Boost',
              primary: isPendingReview ? 'Aguardando analise' : 'Novo resgate',
              secondary: 'Adocao',
            }}
            onOpenRescue={() => push('/compose?type=emergency')}
            onOpenAdoption={() => push('/compose?type=adoption')}
            onOpenUpdates={() => push('/compose')}
            onOpenCases={() => push('/(tabs)/cases')}
            onOpenChat={() => push('/(tabs)/chat')}
            onOpenDonations={() => push('/marketplace')}
            onOpenMap={() => push('/(tabs)/map')}
            onOpenMarketplace={() => push('/marketplace')}
            onOpenBoost={() => push('/compose?type=campaign')}
            animation={quickActionsAnim}
            isReducedMotionEnabled={isReducedMotionEnabled}
          />
        </View>

        {isPendingReview && (
          <View style={styles.visibilityBanner}>
            <View style={styles.visibilityBannerIcon}>
              <Ionicons name="time-outline" size={14} color={WARNING_YELLOW} />
            </View>
            <View style={styles.visibilityBannerCopy}>
              <Text style={styles.visibilityBannerTitle}>Em analise</Text>
              <Text style={styles.visibilityBannerText}>Aprovacao manual pendente</Text>
            </View>
          </View>
        )}

        <Animated.View
          style={[
            styles.subsectionWrapper,
            {
              opacity: requestsAnim,
              transform: [{ translateY: requestsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={styles.subsectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="notifications-circle" size={20} color={ICON_PRIMARY} style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleTextLabel}>Precisa de atencao</Text>
              {urgentRescues.length > 0 && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>Novo</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => push('/(tabs)/map')} accessibilityRole="button">
              <Text style={styles.viewAllText}>Ver mapa</Text>
            </TouchableOpacity>
          </View>
          {urgentRescues.map((item) => (
            <RequestItem
              key={item.id}
              item={item}
              onDetails={() => push('/(tabs)/map')}
              onMap={() => push('/(tabs)/map')}
              onChat={() => push('/(tabs)/chat')}
              entryAnim={new Animated.Value(1)}
              isReducedMotionEnabled={isReducedMotionEnabled}
              disabled={isPendingReview}
            />
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.subsectionWrapper,
            {
              marginTop: -Spacing.md,
              opacity: upcomingAnim,
              transform: [{ translateY: upcomingAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={styles.subsectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="checkmark-circle" size={20} color={ICON_PRIMARY} style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleTextLabel}>Acompanhamentos</Text>
            </View>
            <TouchableOpacity onPress={() => push('/(tabs)/cases')} accessibilityRole="button">
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {adoptionQueue.map((item) => (
            <ConfirmedCaseItem
              key={item.id}
              item={item}
              onPress={() => push('/(tabs)/cases')}
              entryAnim={new Animated.Value(1)}
              isReducedMotionEnabled={isReducedMotionEnabled}
            />
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.subsectionWrapper,
            {
              marginTop: -Spacing.md,
              opacity: networkAnim,
              transform: [{ translateY: networkAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={styles.subsectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="chatbubbles" size={20} color={ICON_PRIMARY} style={styles.sectionTitleIcon} />
              <Text style={styles.sectionTitleTextLabel}>Conversas</Text>
            </View>
            <TouchableOpacity onPress={() => push('/(tabs)/chat')} accessibilityRole="button">
              <Text style={styles.viewAllText}>Abrir</Text>
            </TouchableOpacity>
          </View>
          {MOCK_CONVERSATIONS.slice(0, 2).map((conversation) => (
            <TouchableOpacity key={conversation.id} style={styles.serviceItem} onPress={() => push('/(tabs)/chat')}>
              <View style={styles.serviceItemContent}>
                <View style={styles.serviceItemIconWrapper}>
                  <Ionicons name="person-outline" size={22} color={ICON_PRIMARY} />
                </View>
                <View style={styles.serviceItemDetails}>
                  <Text style={styles.serviceItemText} numberOfLines={1}>
                    {conversation.participant.name}
                  </Text>
                  <Text style={styles.serviceItemTime} numberOfLines={1}>
                    {conversation.lastMessage}
                  </Text>
                </View>
                {conversation.unread > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View
          style={[
            {
              opacity: activeAnim,
              transform: [{ translateY: activeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={quickActionStyles.servicesCard}>
            <Text style={quickActionStyles.servicesTitle} allowFontScaling={false}>
              Operacao ZooHelp
            </Text>
            <View style={quickActionStyles.servicesButtonRow}>
              <TouchableOpacity
                onPress={() => push('/compose?type=campaign')}
                style={[quickActionStyles.servicesButton, quickActionStyles.servicesButtonPrimary]}
                accessibilityRole="button"
              >
                <View style={quickActionStyles.servicesButtonContent}>
                  <Ionicons name="trending-up" size={20} color={WHITE} />
                  <Text style={[quickActionStyles.servicesButtonText, quickActionStyles.servicesPrimaryText]}>
                    Boost
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => push('/marketplace')}
                style={[quickActionStyles.servicesButton, quickActionStyles.servicesButtonSecondary]}
                accessibilityRole="button"
              >
                <View style={quickActionStyles.servicesButtonContent}>
                  <Ionicons name="basket" size={20} color={TEXT_DARK} />
                  <Text style={[quickActionStyles.servicesButtonText, quickActionStyles.servicesSecondaryText]}>
                    Bazar
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

type HeaderStyles = {
  headerContainer: ViewStyle;
  greetingContainer: ViewStyle;
  greetingText: TextStyle;
  providerNameText: TextStyle;
  statusLine: ViewStyle;
  currentDateText: TextStyle;
  pendingText: TextStyle;
  metricsRow: ViewStyle;
  metricBlock: ViewStyle;
  metricLabel: TextStyle;
  metricValue: TextStyle;
  metricDivider: ViewStyle;
  avatarColumn: ViewStyle;
  avatarButton: ViewStyle;
  avatar: ImageStyle;
  avatarPlaceholder: ViewStyle;
  avatarEditBadge: ViewStyle;
};

const headerStyles = StyleSheet.create<HeaderStyles>({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: WHITE,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    ...Platform.select({
      ios: {
        shadowColor: SHADOW_COLOR_SECTION,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
    marginBottom: Spacing.xs,
  },
  greetingContainer: {
    flex: 1,
    marginTop: Platform.OS === 'android' ? Spacing.sm : 5,
    marginLeft: Spacing.sm,
    left: 10,
  },
  greetingText: {
    fontSize: Platform.OS === 'android' ? 12 : 13,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  providerNameText: {
    color: TEXT_DARK,
    fontSize: Platform.OS === 'android' ? 12 : 15,
    fontWeight: '700',
    maxWidth: 220,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currentDateText: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginLeft: 4,
  },
  pendingText: {
    color: '#92400E',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  metricBlock: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: ICON_PRIMARY,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: BORDER_SUBTLE,
    marginHorizontal: 16,
  },
  avatarColumn: {
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarButton: {
    width: 49.5,
    height: 49.5,
    borderRadius: 23.75,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 23.75,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 23.75,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ICON_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
});

const quickActionStyles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 15px rgba(100, 100, 150, 0.15)',
      } as ViewStyle,
      ios: {
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 4 },
    }),
  },
  shortcutsContainer: {
    marginBottom: Spacing.md,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  gridItem: {
    width: 85,
    height: 90,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  iconAccent: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GREEN_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  gridItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    top: -8,
    color: '#4A4A4A',
    textAlign: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: WHITE,
    fontWeight: '600',
    marginHorizontal: Spacing.sm,
    fontSize: 14,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_PRIMARY,
    borderRadius: Radii.pill,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    minWidth: 118,
  },
  secondaryCtaText: {
    color: WHITE,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  servicesCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 4 },
    }),
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: Spacing.md,
  },
  servicesButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  servicesButton: {
    flex: 1,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesButtonPrimary: {
    backgroundColor: ICON_PRIMARY,
  },
  servicesButtonSecondary: {
    backgroundColor: '#F8F9FA',
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
  },
  servicesButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  servicesPrimaryText: {
    color: WHITE,
  },
  servicesSecondaryText: {
    color: TEXT_DARK,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_ALT,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_ALT,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xl + 76,
  },
  visibilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.18)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 2 },
    }),
  },
  visibilityBannerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginRight: Spacing.sm,
  },
  visibilityBannerCopy: {
    flex: 1,
  },
  visibilityBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  visibilityBannerText: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 1,
  },
  subsectionWrapper: {
    marginBottom: Spacing.lg,
    backgroundColor: WHITE,
    borderRadius: Radii.md,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 3 },
    }),
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 1 : 0,
    gap: 0,
  },
  sectionTitleTextLabel: {
    position: 'relative',
    left: 0,
    fontSize: Platform.OS === 'android' ? 17 : 18,
    fontWeight: Platform.OS === 'android' ? '700' : '600',
    color: TEXT_DARK,
  },
  sectionTitleIcon: {
    marginRight: 4,
  },
  newBadge: {
    backgroundColor: DANGER_RED,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginLeft: Spacing.xs,
  },
  newBadgeText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 14,
    color: ICON_PRIMARY,
    fontWeight: '600',
  },
  // ESTILOS NOVOS PARA MICRO FOTO
  requestRowWithPhoto: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  microPhoto: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    resizeMode: 'cover',
  },
  requestContent: {
    flex: 1,
  },
  // ESTILOS ORIGINAIS PRESERVADOS
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 15,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.08)',
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
      } as ViewStyle,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 }, // Sombra premium no Android
    }),
  },
  requestItemUrgent: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(217,45,32,0.12)',
  },
  requestItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },
  requestTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  requestServiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  requestLocation: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '600',
    color: ICON_PRIMARY,
  },
  requestClientName: {
    fontSize: 12,
    color: TEXT_MEDIUM,
    lineHeight: 16,
    marginBottom: 5,
  },
  requestInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoIcon: {
    marginRight: Spacing.xs,
  },
  requestInfoText: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginRight: 12,
  },
  requestActionsCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  compactActionChip: {
    flex: 1,
    minHeight: 31,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.1)',
    backgroundColor: 'rgba(45, 106, 79, 0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapActionChip: {
    flex: 0.75,
    backgroundColor: 'rgba(45, 106, 79, 0.04)',
  },
  compactStatusChip: {
    flex: 0.9,
    minHeight: 31,
    borderRadius: 999,
    backgroundColor: ICON_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactActionText: {
    marginLeft: 5,
    color: ICON_PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },
  compactStatusText: {
    marginLeft: 5,
    color: WHITE,
    fontWeight: '700',
    fontSize: 12,
  },
  disabledButton: {
    backgroundColor: '#98A2B3',
  },
  serviceItem: {
    backgroundColor: WHITE,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(100, 100, 150, 0.15)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 2 },
    }),
  },
  serviceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceItemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN_SOFT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  serviceItemDetails: {
    flex: 1,
  },
  serviceItemText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  serviceItemTime: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  chatBadge: {
    backgroundColor: DANGER_RED,
    borderRadius: 10,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  chatBadgeText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
