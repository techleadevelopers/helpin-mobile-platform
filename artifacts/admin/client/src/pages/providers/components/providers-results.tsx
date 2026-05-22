import { MouseEvent } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, MapPin, Search, Star } from "lucide-react";
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
      <div className="text-center py-12 text-red-600">
        <p>Erro ao carregar ONGs e clínicas: {error?.message}</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return <ProvidersEmptyState searchTerm={searchTerm} />;
  }

  if (viewMode === "table") {
    return (
      <ProvidersTable
        providers={providers}
        onProviderClick={onProviderClick}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="shadow-floating border-0">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center mb-2">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="ml-4 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProvidersEmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ONG ou clínica encontrado</h3>
      <p className="text-gray-500 mb-4">
        {searchTerm ? `Nenhum ONG ou clínica corresponde a "${searchTerm}"` : "Nenhum ONG ou clínica registrada ainda."}
      </p>
    </div>
  );
}

function ProviderAvatar({ provider, sizeClass }: { provider: Provider; sizeClass: string }) {
  const fullName = getProviderFullName(provider);

  return (
    <img
      src={provider.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`}
      alt={`${fullName} profile`}
      className={`${sizeClass} rounded-full object-cover`}
    />
  );
}

function ProviderStatusBadge({ provider }: { provider: Provider }) {
  const status = provider.verificationStatus || "";

  return (
    <Badge className={`border ${getStatusBadge(status)}`}>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="shadow-floating hover:shadow-floating-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0"
        onClick={() => onProviderClick(provider)}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ProviderAvatar provider={provider} sizeClass="w-12 h-12" />
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900">{getProviderFullName(provider)}</h3>
                <p className="text-sm text-gray-500">{provider.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={(event) => onDeleteProvider(event, provider.id)}
                disabled={isDeleting}
              >
                Excluir
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <ProviderStatusBadge provider={provider} />
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                Avaliações
              </span>
              <span className="font-medium">{provider.fiveStarReviewCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Resgates Mensais</span>
              <span className="font-medium">{provider.monthlyBookingsCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Doações recebidas</span>
              <span className="font-medium text-green-600">R$ {formatProviderCurrency(provider.totalEarnings)}</span>
            </div>
          </div>

          {provider.city && (
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{provider.city}</span>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Entrou {formatRelativeTime(new Date(provider.createdAt || Date.now()))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
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
    <Card className="border-0 shadow-floating">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ONG/Clínica</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Doações</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Data de Entrada</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id} onClick={() => onProviderClick(provider)} className="cursor-pointer">
              <TableCell>
                <div className="flex items-center">
                  <ProviderAvatar provider={provider} sizeClass="w-10 h-10" />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{getProviderFullName(provider)}</p>
                    <p className="text-sm text-gray-500">{provider.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ProviderStatusBadge provider={provider} />
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-600">R$ {formatProviderCurrency(provider.totalEarnings)}</span>
              </TableCell>
              <TableCell>{provider.city || "N/A"}</TableCell>
              <TableCell>{formatRelativeTime(new Date(provider.createdAt || Date.now()))}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
