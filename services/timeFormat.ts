export function formatRelativeTime(value: string) {
  if (!value) return 'agora';
  if (!value.includes('T')) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'agora';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'agora';

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} d`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatChatMessageTime(value: string) {
  if (!value) return '';
  if (!value.includes('T')) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
