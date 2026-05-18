import { Share } from 'react-native';

export async function shareZooHelpItem(title: string, message: string) {
  await Share.share({
    title,
    message,
  });
}
