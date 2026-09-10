import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PostLocationMeta } from './PostLocationMeta';

const FEED_TIME_ICON =
  'https://res.cloudinary.com/limpeja/image/upload/v1779576484/pngtree-vector-clock-icon-png-image_4152707_bfoxlj.jpg';

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
  locationDisplay,
  timeDisplay,
  contactDisplay,
  onPressMessage,
  onPressContact,
}: {
  description: string;
  breedAgeParts: string[];
  colors: Colors;
  locationDisplay: string;
  timeDisplay: string;
  contactDisplay?: string;
  onPressMessage: () => void;
  onPressContact: () => void;
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const normalizedDescription = String(description).normalize();
  // Four lines at this size typically hold around 180 characters. Keeping the
  // toggle for longer posts avoids adding visual noise to short descriptions.
  const canExpandDescription = normalizedDescription.trim().length > 180;

  return (
    <View style={styles.publicationBlock}>
      <View style={styles.publicationHeader}>
        <View style={styles.publicationLabelRow}>
          <View style={styles.publicationIcon}>
            <MaterialCommunityIcons name="text-box-outline" size={16} color="#2D6A4F" />
          </View>
          <View style={styles.publicationTextContainer}>
            <View style={styles.publicationTitleRow}>
              <Text style={styles.publicationTitle}>Publicação</Text>
              <View style={styles.publicationTimeRow}>
                <Image source={{ uri: FEED_TIME_ICON }} style={styles.publicationTimeIcon} contentFit="contain" />
                <Text style={styles.publicationSupport}>{timeDisplay}</Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                allowFontScaling={false}
                textBreakStrategy="simple"
                numberOfLines={descriptionExpanded ? undefined : 4}
              >
                {normalizedDescription}
              </Text>
              {canExpandDescription && (
                <TouchableOpacity
                  style={styles.descriptionToggle}
                  onPress={() => setDescriptionExpanded((expanded) => !expanded)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={descriptionExpanded ? 'Recolher descrição' : 'Ver descrição completa'}
                >
                  <Text style={styles.descriptionToggleText}>
                    {descriptionExpanded ? 'Ver menos' : 'Ver mais'}
                  </Text>
                  <MaterialCommunityIcons
                    name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color="#2D6A4F"
                  />
                </TouchableOpacity>
              )}
              {breedAgeParts.length > 0 && (
                <View style={styles.breedAgeRow}>
                  <Text
                    style={[styles.breedAge, { color: colors.mutedForeground }]}
                    allowFontScaling={false}
                  >
                    {breedAgeParts.join(' - ')}
                  </Text>
                </View>
              )}
            </View>

            <PostLocationMeta
              locationDisplay={locationDisplay}
              timeDisplay={timeDisplay}
              contactDisplay={contactDisplay}
              mutedColor={colors.mutedForeground}
              onPressMessage={onPressMessage}
              onPressContact={onPressContact}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  publicationBlock: {
    margin: -5,
    marginTop: 8,
    padding: 12,
    borderRadius: 19,    
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomEndRadius: 22,
    borderBottomStartRadius: 22,
    backgroundColor: '#ffffffc1',
  },
  publicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  publicationLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  publicationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF7F0',
  },
  publicationTextContainer: {
    flex: 1,
    gap: 10,
  },
  publicationTitleRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  publicationTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#18231B',
    letterSpacing: 0,
  },
  publicationSupport: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#7B867E',
    letterSpacing: 0,
  },
  publicationTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  publicationTimeIcon: {
    width: 13,
    height: 13,
    opacity: 0.72,
  },
  descriptionContainer: {
    gap: 5,
    paddingVertical: 2,
    left: -17,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    lineHeight: 19,
    color: '#253029',
    textTransform: 'none',
  },
  descriptionToggle: {
    alignSelf: 'flex-end',
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: '#EEF7F0',
  },
  descriptionToggleText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#2D6A4F',
  },
  breedAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  breedAge: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    opacity: 0.7,
    color: '#78857C',
    textTransform: 'none',
  },
});
