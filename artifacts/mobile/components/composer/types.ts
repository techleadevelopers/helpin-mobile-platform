import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { PostType } from '@/constants/data';

export type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export type ComposerPostType = {
  type: PostType;
  icon: MCIcon;
  label: string;
  color: string;
  light: string;
  cta: string;
};

export type AnimalOption = {
  value: 'dog' | 'cat' | 'other';
  icon: MCIcon;
  label: string;
};

export type ComposerColors = {
  foreground: string;
  mutedForeground: string;
  muted: string;
  border: string;
};

export type AddressSuggestion = {
  id: string;
  label: string;
};

export type AddressResult = {
  label: string;
  latitude: number;
  longitude: number;
};

export const ZOOHELP_HEADER_LOGO =
  'https://res.cloudinary.com/limpeja/image/upload/v1779564981/Gemini_Generated_Image_isin7wisin7wisin-removebg-preview_yx0k5g.png';

export const POST_TYPES: ComposerPostType[] = [
  { type: 'post', icon: 'pencil-outline', label: 'Escrever', color: '#6B7B6B', light: '#6B7B6B15', cta: 'Publicar post' },
  { type: 'adoption', icon: 'home-heart', label: 'Adoção', color: '#2D6A4F', light: '#2D6A4F15', cta: 'Publicar para adoção' },
  { type: 'lost', icon: 'magnify', label: 'Perdido', color: '#D4A259', light: '#D4A25915', cta: 'Reportar animal perdido' },
  { type: 'found', icon: 'check-circle', label: 'Encontrado', color: '#2C5F8A', light: '#2C5F8A15', cta: 'Reportar animal encontrado' },
  { type: 'emergency', icon: 'alert-circle', label: 'Emergência', color: '#C95A5A', light: '#C95A5A15', cta: 'Pedir ajuda urgente' },
  { type: 'campaign', icon: 'heart-multiple', label: 'Campanha', color: '#6B5B8A', light: '#6B5B8A15', cta: 'Lançar campanha' },
];

export const ANIMAL_OPTIONS: AnimalOption[] = [
  { value: 'dog', icon: 'dog', label: 'Cachorro' },
  { value: 'cat', icon: 'cat', label: 'Gato' },
  { value: 'other', icon: 'paw', label: 'Outro' },
];
