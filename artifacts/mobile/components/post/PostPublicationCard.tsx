import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Colors = {
  primary: string;
  foreground: string;
  mutedForeground: string;
  border: string;
};

export function PostPublicationCard({
  description,
  breedAgeParts,
  colors,
  isLiked,
  onShare,
  onLike,
}: {
  description: string;
  breedAgeParts: string[];
  colors: Colors;
  isLiked: boolean;
  onShare: () => void;
  onLike: () => void;
}) {
  return (
    <View style={styles.publicationBlock}>
      <Text style={[styles.publicationTitle, { color: colors.primary }]}>Publicação :</Text>
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text style={[styles.description, { color: colors.foreground }]}>{description}</Text>
          {breedAgeParts.length > 0 && (
            <View style={styles.breedAgeRow}>
              <Text style={[styles.breedAge, { color: colors.mutedForeground }]}>
                {breedAgeParts.join(' - ')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.titleActions}>
          <IconButton
            icon="share-variant-outline"
            color={colors.mutedForeground}
            backgroundColor="#F8FAF7"
            borderColor={colors.border}
            onPress={onShare}
          />
          <IconButton
            icon={isLiked ? 'heart' : 'heart-outline'}
            color={isLiked ? '#C95A5A' : colors.mutedForeground}
            backgroundColor={isLiked ? '#C95A5A0F' : '#F8FAF7'}
            borderColor={isLiked ? '#C95A5A24' : colors.border}
            onPress={onLike}
            size={18}
          />
        </View>
      </View>
    </View>
  );
}

function IconButton({
  icon,
  color,
  backgroundColor,
  borderColor,
  onPress,
  size = 17,
}: {
  icon: MCIcon;
  color: string;
  backgroundColor: string;
  borderColor: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <TouchableOpacity
      style={[styles.titleIconBtn, { backgroundColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  publicationBlock: { gap: 3 },
  publicationTitle: {
    paddingTop: 5,
    paddingBottom: -4,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: -1,
    lineHeight: 21,
    textShadowColor: 'rgba(46,125,50,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 136,
    borderRadius: 16,
    borderWidth: 0.8,
    borderStyle: 'dashed',
    borderColor: 'rgba(45,106,79,0.24)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  titleInfo: { flex: 1, gap: 5 },
  description: {
    paddingTop: 5,
    paddingBottom: 5,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'Montserrat_500Medium',
    opacity: 0.85,
  },
  breedAgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breedAge: { fontSize: 12, fontFamily: 'Montserrat_400Regular', opacity: 0.7 },
  titleActions: { flexDirection: 'row', gap: 6 },
  titleIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#1F3528',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },
});
