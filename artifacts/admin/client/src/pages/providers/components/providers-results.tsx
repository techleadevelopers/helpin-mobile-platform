import { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Eye, MapPin, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Provider } from "@/lib/types";
import {
  formatProviderCurrency,
  formatRelativeTime,
  getProviderFullName,
  getStatusBadge,
} from "../provider-utils";

type ProvidersResultsProps = {
  error?: Error | null;
  isDeleting: boolean;
  isError: boolean;
  isLoading: boolean;
  providers: Provider[];
  searchTerm: string;
  viewMode: "card" | "table";
  onDeleteProvider: (event: MouseEvent, providerId: string) => void;
  onProviderClick: (provider: Provider) => void;
};

export function ProvidersResults({
  error,
  isDeleting,
  isError,
  isLoading,
  providers,
  searchTerm,
  viewMode,
  onDeleteProvider,
  onProviderClick,
}: ProvidersResultsProps) {
  if (isLoading) {
    return <ProvidersLoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Erro ao carregar ONGs e clinicas: {error?.message}
      </div>
    );
  }

  if (providers.length === 0) {
    return <ProvidersEmptyState searchTerm={searchTerm} />;
  }

  if (viewMode === "table") {
    return <ProvidersTable providers={providers} onProviderClick={onProviderClick} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider, index) => (
        <ProviderCard
          key={provider.id}
          index={index}
          isDeleting={isDeleting}
          provider={provider}
          onDeleteProvider={onDeleteProvider}
          onProviderClick={onProviderClick}
        />
      ))}
    </div>
  );
}

function ProvidersLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="border border-gray-100 bg-white shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProvidersEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">Nenhuma ONG encontrada</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm ? `Sem resultados para "${searchTerm}".` : "Nenhuma ONG cadastrada para este filtro."}
      </p>
    </div>
  );
}

export function ProviderAvatar({ provider, sizeClass }: { provider: Provider; sizeClass: string }) {
  const fullName = getProviderFullName(provider);
  const initials =
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "ONG";

  return (
    <Avatar className={`${sizeClass} border border-gray-100 bg-sky-50`}>
      {provider.avatarUrl && (
        <AvatarImage src={provider.avatarUrl} alt={`${fullName} profile`} className="object-cover" />
      )}
      <AvatarFallback className="bg-sky-500 text-sm font-semibold text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function ProviderStatusBadge({ provider }: { provider: Provider }) {
  const status = provider.verificationStatus || "";

  return (
    <Badge className={`border px-2 py-0 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(status)}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function ProviderCard({
  index,
  isDeleting,
  provider,
  onDeleteProvider,
  onProviderClick,
}: {
  index: number;
  isDeleting: boolean;
  provider: Provider;
  onDeleteProvider: (event: MouseEvent, providerId: string) => void;
  onProviderClick: (provider: Provider) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <Card
        className="cursor-pointer border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        onClick={() => onProviderClick(provider)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProviderAvatar provider={provider} sizeClass="h-11 w-11" />
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-gray-950">{getProviderFullName(provider)}</h3>
                <p className="truncate text-xs text-gray-500">{provider.email || "Sem email"}</p>
              </div>
            </div>
            <ProviderStatusBadge provider={provider} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
            <OperationalMetric label="Casos" value={provider.monthlyBookingsCount ?? 0} />
            <OperationalMetric label="Reviews" value={provider.fiveStarReviewCount ?? 0} />
            <OperationalMetric label="Doacoes" value={`R$ ${formatProviderCurrency(provider.totalEarnings)}`} highlight />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 text-xs text-gray-500">
              <div className="flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{provider.city || provider.address?.city || "Local nao informado"}</span>
              </div>
              <p className="mt-1">Entrou {formatRelativeTime(new Date(provider.createdAt || Date.now()))}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-sky-700"
                onClick={(event) => {
                  event.stopPropagation();
                  onProviderClick(provider);
                }}
              >
                <Eye size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600"
                onClick={(event) => onDeleteProvider(event, provider.id)}
                disabled={isDeleting}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OperationalMetric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${highlight ? "text-emerald-700" : "text-gray-950"}`}>
        {value}
      </p>
    </div>
  );
}

function ProvidersTable({
  providers,
  onProviderClick,
}: {
  providers: Provider[];
  onProviderClick: (provider: Provider) => void;
}) {
  return (
    <Card className="border border-gray-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ONG</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Casos</TableHead>
            <TableHead>Doacoes</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Entrada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} onClick={() => onProviderClick(provider)} className="cursor-pointer">
              <TableCell>
                <div className="flex items-center gap-3">
                  <ProviderAvatar provider={provider} sizeClass="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{getProviderFullName(provider)}</p>
                    <p className="truncate text-sm text-gray-500">{provider.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ProviderStatusBadge provider={provider} />
              </TableCell>
              <TableCell>{provider.monthlyBookingsCount ?? 0}</TableCell>
              <TableCell>
                <span className="font-medium text-emerald-700">R$ {formatProviderCurrency(provider.totalEarnings)}</span>
              </TableCell>
              <TableCell>{provider.city || provider.address?.city || "N/A"}</TableCell>
              <TableCell>{formatRelativeTime(new Date(provider.createdAt || Date.now()))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
