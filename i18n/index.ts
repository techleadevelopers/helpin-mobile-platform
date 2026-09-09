import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import deDE from './locales/de-DE';
import enUS from './locales/en-US';
import ptBR from './locales/pt-BR';
import type { Translations } from './types';

const enGB: Translations = {
  ...enUS,
  common: {
    ...enUS.common,
    tagline: 'Animal adoption, rescue and support platform',
  },
  register: {
    ...enUS.register,
    whatsappPlaceholder: '+44 0000 000000',
  },
  profile: {
    ...enUS.profile,
    footer: 'Helpin v1.0 · Protect. Rescue. Adopt.',
  },
};

const deCore: Translations = {
  ...deDE,
  common: {
    ...deDE.common,
    tagline: 'Plattform für Tieradoption, Rettung und Unterstützung',
    back: 'Zurück',
    skip: 'Überspringen',
    viewProfile: 'Profil ansehen →',
    cases: 'Fälle',
  },
  nav: {
    feed: 'Feed',
    map: 'Karte',
    publish: 'Veröffentlichen',
    chat: 'Chat',
    profile: 'Profil',
  },
  auth: {
    ...deDE.auth,
    emailPlaceholder: 'Deine E-Mail',
    forgotPassword: 'Passwort vergessen?',
    loggingIn: 'Anmeldung...',
    createAccount: 'Kostenloses Konto erstellen',
    errRequired: 'Bitte fülle E-Mail und Passwort aus.',
    errLogin: 'Anmeldung nicht möglich. Bitte versuche es erneut.',
  },
  register: {
    ...deDE.register,
    title: 'Konto erstellen',
    subtitle: 'Wähle den Profiltyp, der am besten zu dir passt',
    personalTitle: 'Persönliches Konto',
    personalDesc: 'Adoptant, unabhängiger Tierschützer oder Freiwilliger',
    ongTitle: 'NGO / Tierschützer',
    ongDesc: 'Rettungs-, Adoptions- oder Tierarztorganisation',
    greetingTitle: 'Hallo!',
    greetingSubtitle: 'Wie können wir dich nennen?',
    almostTitle: 'Fast geschafft!',
    almostSubtitle: 'Erstelle ein sicheres Passwort für dein Konto',
    fullNameLabel: 'Vollständiger Name',
    fullNamePlaceholder: 'Dein vollständiger Name',
    createBtn: 'Konto erstellen',
    creating: 'Konto wird erstellt...',
    errName: 'Bitte gib deinen vollständigen Namen ein.',
    errEmail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    errMismatchTitle: 'Passwörter stimmen nicht überein',
    errMismatch: 'Die Passwörter stimmen nicht überein.',
  },
};

const trTR: Translations = {
  ...enUS,
  common: {
    ...enUS.common,
    tagline: 'Hayvan sahiplendirme, kurtarma ve destek platformu',
    continue: 'Devam et',
    back: 'Geri',
    cancel: 'İptal',
    save: 'Kaydet',
    skip: 'Atla',
    next: 'İleri',
    done: 'Tamam',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı!',
    terms: 'Kullanım Şartları',
    privacy: 'Gizlilik Politikası',
    termsAgreement: 'Hesap oluşturarak Kullanım Şartları ve Gizlilik Politikası’nı kabul edersiniz',
    verified: 'Doğrulandı',
    urgent: 'Acil',
    follow: 'Takip et',
    following: 'Takip ediliyor',
    help: 'Yardım et',
    donate: 'Bağış yap',
    contact: 'İletişim',
    viewProfile: 'Profili gör →',
    cases: 'vaka',
  },
  nav: {
    feed: 'Akış',
    map: 'Harita',
    publish: 'Yayınla',
    chat: 'Sohbet',
    profile: 'Profil',
  },
  auth: {
    ...enUS.auth,
    title: 'Giriş yap',
    emailPlaceholder: 'E-posta adresiniz',
    passwordPlaceholder: 'Şifre',
    forgotPassword: 'Şifrenizi mi unuttunuz?',
    loginBtn: 'Giriş yap',
    loggingIn: 'Giriş yapılıyor...',
    or: 'veya',
    createAccount: 'Ücretsiz hesap oluştur',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    loginLink: 'Giriş yap',
    errRequiredTitle: 'Zorunlu alanlar',
    errRequired: 'Lütfen e-posta ve şifrenizi girin.',
    errLoginTitle: 'Giriş hatası',
    errLogin: 'Giriş yapılamadı. Lütfen tekrar deneyin.',
  },
  register: {
    ...enUS.register,
    title: 'Hesap oluştur',
    subtitle: 'Sizi en iyi temsil eden profil türünü seçin',
    personalTitle: 'Kişisel hesap',
    personalDesc: 'Sahiplenen, bağımsız kurtarıcı veya gönüllü',
    ongTitle: 'STK / Koruyucu',
    ongDesc: 'Kurtarma, sahiplendirme veya veteriner kuruluşu',
    greetingTitle: 'Merhaba!',
    greetingSubtitle: 'Size nasıl hitap edelim?',
    almostTitle: 'Neredeyse tamam!',
    almostSubtitle: 'Hesabınız için güvenli bir şifre oluşturun',
    fullNameLabel: 'Ad soyad',
    emailLabel: 'E-posta',
    passwordLabel: 'Şifre',
    confirmPasswordLabel: 'Şifreyi onayla',
    fullNamePlaceholder: 'Adınız ve soyadınız',
    emailPlaceholder: 'siz@email.com',
    passwordPlaceholder: 'En az 8 karakter',
    confirmPasswordPlaceholder: 'Şifreyi tekrar girin',
    createBtn: 'Hesap oluştur',
    registerOngBtn: 'STK kaydı',
    creating: 'Hesap oluşturuluyor...',
    errSelectTypeTitle: 'Hesap türü seçin',
    errSelectType: 'Kişisel hesap veya STK seçin.',
    errNameTitle: 'Zorunlu alan',
    errName: 'Lütfen adınızı ve soyadınızı girin.',
    errEmailTitle: 'Geçersiz e-posta',
    errEmail: 'Lütfen geçerli bir e-posta adresi girin.',
    errWeakPasswordTitle: 'Zayıf şifre',
    errWeakPassword: 'Şifre en az 8 karakter olmalıdır.',
    errMismatchTitle: 'Şifreler eşleşmiyor',
    errMismatch: 'Girilen şifreler eşleşmiyor.',
    errCreateTitle: 'Hata',
    errCreate: 'Hesap oluşturulamadı. Lütfen tekrar deneyin.',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    loginLink: 'Giriş yap',
    stepOf: '/',
  },
  feed: {
    ...enUS.feed,
    greetingMorning: 'Günaydın',
    greetingAfternoon: 'İyi günler',
    greetingEvening: 'İyi akşamlar',
    visitor: 'Ziyaretçi',
    helpNearby: 'Yakınınızdaki hayvanlara yardım edin',
    search: 'Hayvan, STK veya kampanya ara...',
  },
  profile: {
    ...enUS.profile,
    title: 'Profilim',
    logout: 'Çıkış yap',
    settings: 'Ayarlar',
    language: 'Dil',
    footer: 'Helpin v1.0 · Koru. Kurtar. Sahiplendir.',
  },
  language: {
    selectTitle: 'Dil',
    selectSubtitle: 'Uygulama dilini seçin',
  },
};

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'en-GB': { translation: enGB },
  'de-DE': { translation: deCore },
  'tr-TR': { translation: trTR },
};

export const supportedLocales = Object.keys(resources);

function resolveLocale(languageTag?: string | null, languageCode?: string | null, regionCode?: string | null) {
  const tag = languageTag?.replace('_', '-');
  if (tag && supportedLocales.includes(tag)) return tag;
  if (languageCode === 'de') return 'de-DE';
  if (languageCode === 'tr') return 'tr-TR';
  if (languageCode === 'en' && regionCode === 'GB') return 'en-GB';
  if (languageCode === 'en') return 'en-US';
  if (languageCode === 'pt') return 'pt-BR';
  return 'en-US';
}

const deviceLocale = Localization.getLocales()[0];
const initialLocale = resolveLocale(
  deviceLocale?.languageTag,
  deviceLocale?.languageCode,
  deviceLocale?.regionCode,
);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: 'en-US',
    supportedLngs: supportedLocales,
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export default i18n;
