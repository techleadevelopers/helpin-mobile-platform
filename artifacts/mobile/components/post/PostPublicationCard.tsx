import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PostLocationMeta } from './PostLocationMeta';

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
  onPressMessage,
}: {
  description: string;
  breedAgeParts: string[];
  colors: Colors;
  locationDisplay: string;
  timeDisplay: string;
  onPressMessage: () => void;
}) {
  return (
    <View style={styles.publicationBlock}>
      <View style={styles.publicationHeader}>
        <View style={styles.publicationLabelRow}>
          <View style={styles.publicationIcon}>
            <MaterialCommunityIcons name="text-box-edit-outline" size={15} color={colors.primary} />
          </View>
          <View style={styles.publicationTextContainer}>
            <Text style={[styles.publicationTitle, { color: colors.primary }]}>PUBLICAÇÃO</Text>
            <Text style={styles.publicationSupport}>Detalhes compartilhados.</Text>
            <View style={[styles.descriptionContainer, { left: -20, right: -4, marginTop: 5 }]}>
              <Text
                style={[styles.description, { color: "#5f5c5c" }]}
                allowFontScaling={false}
                textBreakStrategy="simple"
              >
                {String(description).normalize()}
              </Text>
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
              mutedColor={colors.mutedForeground}
              onPressMessage={onPressMessage}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  publicationBlock: {
    gap: 10,
    padding: 9,
    borderRadius: 22,
    shadowColor: '#183F2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 13,
    elevation: 2,
  },
  publicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#38a78213',
    paddingVertical: 12,
    borderRadius: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#1F3528',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1,
    paddingBottom: 30,
  },
  publicationLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 8,
  },
  publicationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicationTextContainer: {
    flex: 1,
    gap: 2,
  },
  publicationTitle: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    letterSpacing: 0.72,
    lineHeight: 14,
  },
  publicationSupport: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#78857C',
    lineHeight: 8,
    marginBottom: 10,
  },
  descriptionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginTop: 18,
    marginLeft: -4,
    marginRight: -4,
  },
  description: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 14,
    color: '#78857C',
    textTransform: 'none', // Garante que não haverá transformação para maiúsculas/minúsculas
  },
  breedAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  breedAge: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_400Regular',
    opacity: 0.7,
    color: '#78857C',
    textTransform: 'none', // Garante que não haverá transformação
  },
});
