import type { ComponentType } from "react";
import { Mail, MapPin, Phone, ShieldCheck, Siren, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Provider } from "@/lib/types";
import {
  formatProviderCurrency,
  formatRelativeTime,
  getProviderFullName,
  getStatusBadge,
} from "../provider-utils";
import { ProviderAvatar } from "./providers-results";

type ProviderOperationalDialogProps = {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProviderOperationalDialog({
  provider,
  open,
  onOpenChange,
}: ProviderOperationalDialogProps) {
  if (!provider) return null;

  const fullName = getProviderFullName(provider);
  const status = provider.verificationStatus || "";
  const city = provider.city || provider.address?.city || "Nao informado";
  const state = provider.state || provider.address?.state || "";
  const address = [
    provider.street || provider.address?.street,
    provider.number || provider.address?.number,
    provider.neighborhood || provider.address?.neighborhood,
    city,
    state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-0 p-0 shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <ProviderAvatar provider={provider} sizeClass="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold text-gray-950">
                  {fullName}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-gray-500">
                  Visao operacional da rede, trust e capacidade de atendimento.
                </DialogDescription>
              </div>
              <Badge className={`border px-2 py-0 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadge(status)}`}>
                {status.replace(/_/g, " ")}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <MetricTile icon={Siren} label="Casos mensais" value={provider.monthlyBookingsCount ?? 0} />
              <MetricTile icon={ShieldCheck} label="Reviews 5 estrelas" value={provider.fiveStarReviewCount ?? 0} />
              <MetricTile icon={Wallet} label="Doacoes recebidas" value={`R$ ${formatProviderCurrency(provider.totalEarnings)}`} />
              <MetricTile label="Na rede" value={formatRelativeTime(new Date(provider.createdAt || Date.now()))} />
            </div>

            <section className="mt-4 rounded-2xl border border-gray-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cobertura operacional</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <InfoLine icon={MapPin} label="Cidade" value={state ? `${city}, ${state}` : city} />
                <InfoLine icon={MapPin} label="Endereco" value={address || "Nao informado"} />
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contato</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <InfoLine icon={Mail} label="Email" value={provider.email || "Nao informado"} />
                <InfoLine icon={Phone} label="Telefone" value={provider.phone || provider.userPhone || "Nao informado"} />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trust</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <InfoLine label="CNPJ" value={provider.cnpj || "Nao informado"} />
                <InfoLine label="Tipo" value={provider.ongType || "Proteção animal"} />
                <InfoLine label="Fundação" value={provider.foundationYear ? String(provider.foundationYear) : "Nao informado"} />
              </div>
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type MetricTileProps = {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
};

function MetricTile({ label, value, icon: Icon }: MetricTileProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-emerald-600" />}
      </div>
      <p className="mt-2 truncate text-xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}

type InfoLineProps = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
};

function InfoLine({ label, value, icon: Icon }: InfoLineProps) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="break-words text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}
