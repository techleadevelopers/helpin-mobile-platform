import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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

import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { MOCK_POSTS } from '@/constants/data';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MENU_ITEMS: Array<{ icon: MCIcon; label: string; badge?: string; color: string; route?: string }> = [
  { icon: 'lightning-bolt-outline',   label: 'Minha atividade',                    color: '#FF9800', route: '/activity' },
  { icon: 'bell-badge-outline',       label: 'Notificações',           badge: '3', color: '#FF3B30' },
  { icon: 'heart-outline',            label: 'Meus favoritos',                     color: '#FF6B6B' },
  { icon: 'certificate-outline',      label: 'Verificação de conta',               color: '#9B59B6' },
  { icon: 'account-multiple-outline', label: 'Convidar amigos',                    color: '#2F80ED' },
  { icon: 'help-circle-outline',      label: 'Suporte',                            color: '#4CAF50' },
  { icon: 'shield-check-outline',     label: 'Privacidade e segurança',            color: '#2F80ED' },
  { icon: 'cog-outline',              label: 'Configurações',                      color: '#6E6E73' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useApp();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const myPosts = MOCK_POSTS.slice(0, 3);

  function handleLogout() {
    Alert.alert('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados, publicações e histórico serão permanentemente apagados. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir minha conta',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Tem certeza absoluta?',
              `Você está prestes a excluir permanentemente a conta de "${displayName}". Não será possível recuperá-la.`,
              [
                { text: 'Voltar', style: 'cancel' },
                {
                  text: 'Sim, excluir conta',
                  style: 'destructive',
                  onPress: () => logout(),
                },
              ]
            );
          },
        },
      ]
    );
  }

  const displayName = user?.name ?? 'Visitante';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Meu perfil</Text>
        <TouchableOpacity
          style={[
            styles.editBtn,
            {
              backgroundColor: colors.primary + '12',
              borderColor: colors.primary + '40',
              shadowColor: colors.primary,
            },
          ]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.avatarSection}>
          <Avatar name={displayName} size={58} verified={user?.verified} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {user?.email ?? 'Faça login para ver seu email'}
            </Text>
            {user?.type && (
              <View style={[styles.typeBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.typeBadgeText, { color: colors.mutedForeground }]}>
                  {user.type === 'ong' ? 'ONG' : user.type === 'vet' ? 'Veterinário' : 'Protetor(a)'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.bio, { color: colors.mutedForeground }]}>
          {user?.bio ?? 'Apaixonado(a) por animais'}
        </Text>

        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          {[
            { label: 'Posts',   value: user?.postsCount ?? 0,     color: colors.primary,   icon: 'paw' as MCIcon },
            { label: 'Ajudas',  value: user?.helpedCount ?? 0,    color: '#2F80ED',         icon: 'hand-heart' as MCIcon },
            { label: 'Adoções', value: user?.adoptionsCount ?? 0, color: '#9B59B6',         icon: 'home-heart' as MCIcon },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <MaterialCommunityIcons name={stat.icon} size={15} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Meus casos</Text>
        {myPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[styles.postRow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
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
              <MaterialCommunityIcons name="heart-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.likes}</Text>
              <MaterialCommunityIcons name="comment-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.postStatText, { color: colors.mutedForeground }]}>{post.comments}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        {MENU_ITEMS.map((item, i) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.85}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View
                style={[
                  styles.menuIconBg,
                  {
                    backgroundColor: item.color + '14',
                    borderColor: item.color + '40',
                    shadowColor: item.color,
                  },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              {item.badge && (
                <View style={[styles.menuBadge, { backgroundColor: '#FF3B30' }]}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            {i < MENU_ITEMS.length - 1 && (
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.logoutBtn,
          {
            backgroundColor: '#FF3B3008',
            borderColor: '#FF3B3050',
            shadowColor: '#FF3B30',
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="logout" size={19} color="#FF3B30" />
        <Text style={[styles.logoutText, { color: '#FF3B30' }]}>Sair da conta</Text>
      </TouchableOpacity>

      {/* ── Zona de perigo ── */}
      <View style={[styles.dangerZone, { borderColor: '#FF3B3025', backgroundColor: '#FF3B3006' }]}>
        <View style={styles.dangerHeader}>
          <MaterialCommunityIcons name="alert-octagon-outline" size={15} color="#FF3B30" />
          <Text style={[styles.dangerTitle, { color: '#FF3B30' }]}>Zona de perigo</Text>
        </View>
        <Text style={[styles.dangerDesc, { color: colors.mutedForeground }]}>
          A exclusão de conta remove permanentemente todos os seus dados, publicações e histórico. Esta ação é irreversível.
        </Text>
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: '#FF3B3060' }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="delete-forever-outline" size={17} color="#FF3B30" />
          <Text style={styles.deleteBtnText}>Excluir minha conta</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        ZooHelp v1.0 · Proteja. Resgate. Adote.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileCard: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 2,
  },
  typeBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  bio: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  postInfo: { flex: 1, gap: 6 },
  postName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postTime: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  postStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginRight: 6 },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 3,
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  menuBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  menuDivider: { height: 1, marginLeft: 66 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  dangerZone: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dangerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dangerDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 2,
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FF3B30',
  },

  version: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
});
