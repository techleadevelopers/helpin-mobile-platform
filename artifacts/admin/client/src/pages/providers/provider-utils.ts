import { Provider, VerificationStatus } from "@/lib/types";

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Agora mesmo";
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrá`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrá`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrá`;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case VerificationStatus.APPROVED:
      return "bg-green-100 text-green-700 border-green-200";
    case VerificationStatus.PENDING_DOCUMENTS_UPLOAD:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case VerificationStatus.PENDING_MANUAL_REVIEW:
      return "bg-orange-100 text-orange-700 border-orange-200";
    case VerificationStatus.REJECTED:
      return "bg-red-100 text-red-700 border-red-200";
    case VerificationStatus.BLOCKED:
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

export const getProviderFullName = (provider?: Provider | null) =>
  provider?.fullName || provider?.name || "Sem nome";

export const formatProviderCurrency = (value?: string | null) =>
  parseFloat(value || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 });
