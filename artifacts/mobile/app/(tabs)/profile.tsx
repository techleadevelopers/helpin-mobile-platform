import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { MOCK_POSTS } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { shareZooHelpItem } from '@/services/share';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MENU_ITEMS: Array<{ icon: MCIcon; label: string; badge?: string; color: string; route?: string }> = [
  { icon: 'lightning-bolt-outline',   label: 'Minha atividade',                color: '#A8886B', route: '/activity' },
  { icon: 'bell-badge-outline',       label: 'Notificações',         badge: '3', color: '#B87A7A', route: '/notifications' },
  { icon: 'heart-outline',            label: 'Meus favoritos',                  color: '#B87A7A', route: '/favorites' },
  { icon: 'certificate-outline',      label: 'Verificação de conta',            color: '#8B7B8B', route: '/verification' },
  { icon: 'account-multiple-outline', label: 'Convidar amigos',                 color: '#7B8B8B' },
  { icon: 'help-circle-outline',      label: 'Suporte',                         color: '#6B8B6B', route: '/support' },
  { icon: 'shield-check-outline',     label: 'Privacidade e segurança',         color: '#7B8B8B', route: '/privacy' },
  { icon: 'cog-outline',              label: 'Configurações',                   color: '#8B8B8B', route: '/settings' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, deleteAccount } = useApp();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const myPosts = MOCK_POSTS.slice(0, 2);
  const scaleAnim = useSharedValue(1);
  const logoutScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const animatedLogoutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoutScale.value }],
  }));

  function handlePressIn() {
    scaleAnim.value = withSpring(0.985, { damping: 20, stiffness: 400 });
  }

  function handlePressOut() {
    scaleAnim.value = withSpring(1, { damping: 20, stiffness: 400 });
  }

  function handleLogoutPressIn() {
    logoutScale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
  }

  function handleLogoutPressOut() {
    logoutScale.value = withSpring(1, { damping: 20, stiffness: 400 });
  }

  function handleLogout() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Sair da conta',
      'Você será desconectado e precisará fazer login novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => logout() },
      ]
    );
  }

  function handleDeleteAccount() {
    setIsDeleteModalVisible(false);
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados serão permanentemente apagados. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteAccount(),
        },
      ]
    );
  }

  const displayName = user?.name ?? '';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header compacto */}
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          {displayName || 'Perfil'}
        </Text>
        <TouchableOpacity
          style={[
            styles.editBtn,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Editar perfil', 'Funcionalidade em breve.');
          }}
        >
          <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Card do perfil - tons suaves */}
      <Animated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.avatarSection}>
            <Avatar name={displayName || 'U'} size={56} verified={user?.verified} type={user?.type} />
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                  {displayName || 'Usuário'}
                </Text>
                {user?.verified && (
                  <View style={[styles.verifiedChip, { backgroundColor: colors.muted }]}>
                    <MaterialCommunityIcons name="check-decagram" size={11} color={colors.primary} />
                  </View>
                )}
              </View>
              {user?.email && (
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user.email}
                </Text>
              )}
              {user?.type && (
                <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons
                    name={user.type === 'ong' ? 'home-heart' : user.type === 'vet' ? 'medical-bag' : 'paw'}
                    size={10}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.typeBadgeText, { color: colors.mutedForeground }]}>
                    {user.type === 'ong' ? 'ONG' : user.type === 'vet' ? 'Veterinário' : 'Protetor'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.bio, { color: colors.mutedForeground }]}>
            {user?.bio ?? '🐾 Apaixonado por animais'}
          </Text>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            {[
              { label: 'Posts', value: user?.postsCount ?? 12, icon: 'paw' as MCIcon },
              { label: 'Ajudas', value: user?.helpedCount ?? 8, icon: 'hand-heart' as MCIcon },
              { label: 'Adoções', value: user?.adoptionsCount ?? 3, icon: 'home-heart' as MCIcon },
            ].map((stat, idx) => (
              <View key={stat.label} style={[styles.statItem, idx > 0 && { borderLeftColor: colors.border }]}>
                <MaterialCommunityIcons name={stat.icon} size={14} color={colors.mutedForeground} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Seção Meus casos */}
      {myPosts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Meus casos</Text>
            <TouchableOpacity onPress={() => router.push('/activity')} activeOpacity={0.7}>
              <Text style={[styles.seeAllText, { color: colors.mutedForeground }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {myPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={[
                styles.postRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/post/${post.id}`)}
              activeOpacity={0.92}
            >
              <View style={styles.postInfo}>
                <Text style={[styles.postName, { color: colors.foreground }]} numberOfLines={1}>
                  {post.name}
                </Text>
                <View style={styles.postMeta}>
                  <StatusBadge type={post.type} size="sm" />
                  <Text style={[styles.postTime, { color: colors.mutedForeground }]}>
                    {post.createdAt}
                  </Text>
                </View>
              </View>
              <View style={styles.postStats}>
                <MaterialCommunityIcons name="heart-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.likes}</Text>
                <MaterialCommunityIcons name="comment-outline" size={12} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
                <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.comments}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Menu de configurações */}
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MENU_ITEMS.map((item, i) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
                else if (item.label === 'Convidar amigos') {
                  shareZooHelpItem('ZooHelp', 'Conheça o ZooHelp e ajude animais perto de você.');
                }
              }}
            >
              <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              {item.badge && (
                <View style={[styles.menuBadge, { backgroundColor: '#B87A7A' }]}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {i < MENU_ITEMS.length - 1 && (
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Botão Sair */}
      <Animated.View style={animatedLogoutStyle}>
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
          onPressIn={handleLogoutPressIn}
          onPressOut={handleLogoutPressOut}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="logout" size={18} color={colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Sair da conta</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Zona de perigo - compacta */}
      <View style={[styles.dangerZone, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <TouchableOpacity
          style={styles.dangerHeader}
          onPress={() => setIsDeleteModalVisible(!isDeleteModalVisible)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.dangerTitle, { color: colors.mutedForeground }]}>Excluir conta</Text>
          <MaterialCommunityIcons
            name={isDeleteModalVisible ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        {isDeleteModalVisible && (
          <View style={styles.dangerContent}>
            <Text style={[styles.dangerDesc, { color: colors.mutedForeground }]}>
              Esta ação é irreversível. Todos os seus dados serão permanentemente apagados.
            </Text>
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: colors.border }]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="delete-forever-outline" size={15} color="#B87A7A" />
              <Text style={[styles.deleteBtnText, { color: '#B87A7A' }]}>Excluir permanentemente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>ZooHelp v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },

  /* Header compacto */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  /* Profile Card */
  profileCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo: { flex: 1, gap: 3 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  verifiedChip: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userEmail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  bio: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 0,
  },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  /* Meus casos */
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  seeAllText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  postInfo: { flex: 1, gap: 4 },
  postName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postTime: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  postStats: { flexDirection: 'row', alignItems: 'center' },
  postStatText: { fontSize: 11, fontFamily: 'Inter_500Medium', marginRight: 2, minWidth: 18, textAlign: 'center' },

  /* Menu Card */
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  menuBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9,
    marginRight: 4,
  },
  menuBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  menuDivider: { height: 1, marginLeft: 48 },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  /* Danger Zone */
  dangerZone: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dangerTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  dangerContent: { gap: 10, marginTop: 2 },
  dangerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  version: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4, opacity: 0.6 },
});