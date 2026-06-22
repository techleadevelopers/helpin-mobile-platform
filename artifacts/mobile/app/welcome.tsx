import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES: Array<{ id: string; icon: MCIcon; color: string; title: string; subtitle: string }> = [
  {
    id: '1',
    icon: 'paw',
    color: '#4CAF50',
    title: 'Adote com amor',
    subtitle: 'Encontre animais para adoção perto de você. Dê um lar cheio de carinho para quem mais precisa.',
  },
  {
    id: '2',
    icon: 'map-marker-radius',
    color: '#2F80ED',
    title: 'Resgate próximo',
    subtitle: 'Veja animais perdidos, encontrados e emergências na sua regiío. Seja parte da rede de proteção animal.',
  },
  {
    id: '3',
    icon: 'account-group',
    color: '#9B59B6',
    title: 'Comunidade que cuida',
    subtitle: 'ONGs, protetores e veterinários unidos por um propósito: o bem-estar de todos os animais.',
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  async function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await completeOnboarding();
      router.replace('/login');
    }
  }

  async function handleSkip() {
    await completeOnboarding();
    router.replace('/login');
  }

  const currentSlide = SLIDES[currentIndex];

  return (
    <LinearGradient
      colors={['#F0FBF1', '#E8F4FE', '#F8F0FF']}
      style={[styles.container, { paddingTop: topPad }]}
    >
      <View style={[styles.header, { paddingTop: 16 }]}>
        <Text style={[styles.logo, { color: colors.primary }]}>Helpin</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Pular</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '18', borderColor: item.color + '35' }]}>
              <View
                style={[
                  styles.iconInner,
                  {
                    backgroundColor: item.color,
                    shadowColor: item.color,
                    borderColor: item.color + '80',
                  },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={52} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.slideTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? currentSlide.color : colors.border,
                  width: i === currentIndex ? 28 : 8,
                  shadowColor: i === currentIndex ? currentSlide.color : 'transparent',
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: currentSlide.color,
              shadowColor: currentSlide.color,
              borderColor: currentSlide.color + '60',
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logo: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  skipBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  skipText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  iconCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1.5,
  },
  slideTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
