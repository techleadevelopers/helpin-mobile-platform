import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export type ProfileTab = 'posts' | 'active' | 'resolved' | 'about';
export type SocialOverlayType = 'followers' | 'following' | null;

