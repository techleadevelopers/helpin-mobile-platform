import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Search,
  ShieldCheck,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VerificationModal from "@/components/verification/verification-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchVerificationQueue, updateProviderStatus } from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types";

type QueueFilter = "all" | VerificationStatus;

const statusPresentation: Partial<Record<VerificationStatus, {
  label: string;
  priority: string;
  badge: string;
  icon: typeof Clock3;
  gradient: string;
}>> = {
  [VerificationStatus.PENDING_DOCUMENTS_UPLOAD]: {
    label: "Documentos pendentes",
    priority: "Media",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: FileText,
    gradient: "from-amber-400 to-orange-500",
  },
  [VerificationStatus.PENDING_MANUAL_REVIEW]: {
    label: "Revisao manual",
    priority: "Alta",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    icon: Eye,
    gradient: "from-orange-500 to-red-500",
  },
  [VerificationStatus.PENDING_INITIAL_REVIEW]: {
    label: "Triagem inicial",
    priority: "Media",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Clock3,
    gradient: "from-blue-500 to-indigo-600",
  },
  [VerificationStatus.PENDING_BACKGROUND_CHECK]: {
    label: "Analise cadastral",
    priority: "Media",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    icon: ShieldCheck,
    gradient: "from-violet-500 to-purple-600",
  },
};

const fallbackStatus = {
  label: "Verificacao pendente",
  priority: "Baixa",
  badge: "border-slate-200 bg-slate-50 text-slate-700",
  icon: Clock3,
  gradient: "from-slate-600 to-slate-800",
};

const getStatus = (provider: Provider) => statusPresentation[provider.verificationStatus] ?? fallbackStatus;
const getProviderName = (provider?: Provider | null) => provider?.fullName || provider?.name || "Sem nome";
const getProviderInitials = (provider: Provider) =>
  getProviderName(provider)
    .split(/\s+/)
    .slice(0, 2)
    .map((value) => value[0])
    .join("")
    .toUpperCase();

const formatValue = (value?: string | number | null) => String(value ?? "").trim() || "Nao informado";
const formatElapsed = (value: string) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (elapsedMinutes < 1) return "Agora";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)} h`;
  return `${Math.floor(elapsedMinutes / 1440)} d`;
};
const formatAddress = (provider: Provider) => {
  const location = [provider.city, provider.state].filter(Boolean).join(" / ");
  return location || "Localizacao nao informada";
};

function StatusBadge({ provider }: { provider: Provider }) {
  const status = getStatus(provider);
  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}>
      {status.label}
    </Badge>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: typeof Clock3;
  gradient: string;
  delay: number;
};

function MetricCard({ title, value, detail, icon: Icon, gradient, delay }: MetricCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}>
      <Card className="border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">{value}</p>
            <p className="mt-1.5 flex items-center text-xs font-medium text-gray-500">
              <Activity size={12} className="mr-1 text-emerald-600" />
              {detail}
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="text-white" size={18} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

type ProviderReviewPanelProps = {
  provider: Provider | null;
  isUpdating: boolean;
  onApprove: (id: string) => void;
  onBlock: (id: string) => void;
  onOpenDossier: () => void;
};

function ProviderReviewPanel({ provider, isUpdating, onApprove, onBlock, onOpenDossier }: ProviderReviewPanelProps) {
  if (!provider) {
    return (
      <div className="flex min-h-[490px] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <ShieldCheck size={24} className="text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-900">Selecione uma ONG</p>
        <p className="mt-1 max-w-xs text-sm text-gray-500">Consulte o cadastro e tome uma decisao de verificacao.</p>
      </div>
    );
  }

  const status = getStatus(provider);
  return (
    <div className="space-y-5 p-5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
            {provider.avatarUrl ? (
              <img src={provider.avatarUrl} alt={getProviderName(provider)} className="h-full w-full object-cover" />
            ) : (
              <span className="font-semibold text-emerald-200">{getProviderInitials(provider)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Em analise</p>
            <p className="mt-1 truncate text-lg font-semibold">{getProviderName(provider)}</p>
            <p className="truncate text-sm text-slate-300">{provider.email}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <StatusBadge provider={provider} />
          <p className="text-xs text-slate-300">{formatElapsed(provider.createdAt)} na fila</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dados cadastrais</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Nome juridico</p>
            <p className="mt-1 font-semibold text-gray-900">{formatValue(provider.legalName || provider.fullName)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">CNPJ</p>
            <p className="mt-1 font-semibold text-gray-900">{formatValue(provider.cnpj)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Tipo</p>
            <p className="mt-1 font-semibold text-gray-900">{formatValue(provider.ongType)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Contato</p>
            <p className="mt-1 font-semibold text-gray-900">{formatValue(provider.phone || provider.userPhone)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400">Localizacao</p>
            <p className="mt-1 font-semibold text-gray-900">{formatAddress(provider)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prioridade da revisao</p>
          <span className="text-xs font-semibold text-orange-600">{status.priority}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Abra o dossie para conferir documentos, OCR, prova de vivacidade, vitrine e localizacao antes da decisao final.
        </p>
        <Button onClick={onOpenDossier} className="mt-4 h-11 w-full rounded-xl bg-medium-blue text-white hover:bg-blue-700">
          <Eye size={16} />
          Abrir dossie completo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onApprove(provider.id)}
          disabled={isUpdating}
          className="h-11 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <CheckCircle2 size={16} />
          Aprovar
        </Button>
        <Button
          variant="outline"
          onClick={() => onBlock(provider.id)}
          disabled={isUpdating}
          className="h-11 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
        >
          <Ban size={16} />
          Bloquear
        </Button>
      </div>
      <p className="text-center text-[11px] text-gray-400">Atalhos: A aprovar, R abrir dossie, B bloquear</p>
    </div>
  );
}

export default function VerificationQueue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueueFilter>("all");

  const { data: queue = [], isLoading, isError, error } = useQuery<Provider[], Error>({
    queryKey: ["/verification/pending-queue"],
    queryFn: fetchVerificationQueue,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const filteredQueue = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return queue.filter((provider) => {
      const matchesStatus = statusFilter === "all" || provider.verificationStatus === statusFilter;
      const matchesSearch =
        !search ||
        getProviderName(provider).toLowerCase().includes(search) ||
        provider.email.toLowerCase().includes(search) ||
        (provider.cnpj ?? "").toLowerCase().includes(search) ||
        (provider.city ?? "").toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [queue, searchTerm, statusFilter]);

  useEffect(() => {
    if (!filteredQueue.length) {
      setSelectedProviderId(null);
      return;
    }
    if (!selectedProviderId || !filteredQueue.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(filteredQueue[0].id);
    }
  }, [filteredQueue, selectedProviderId]);

  const selectedProvider = queue.find((provider) => provider.id === selectedProviderId) ?? null;

  const updateStatus = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: VerificationStatus; rejectionReason?: string }) =>
      updateProviderStatus(id, status, rejectionReason),
    onSuccess: (updatedProvider) => {
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      toast({
        title: "Status atualizado",
        description: `${getProviderName(updatedProvider)} foi atualizado com sucesso.`,
      });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Erro ao atualizar status", description: mutationError.message, variant: "destructive" });
    },
  });

  const handleApprove = (id: string) => updateStatus.mutate({ id, status: VerificationStatus.APPROVED });
  const handleReject = (id: string, reason: string) =>
    updateStatus.mutate({ id, status: VerificationStatus.REJECTED, rejectionReason: reason });
  const handleBlock = (id: string) => {
    if (window.confirm("Tem certeza que deseja bloquear esta ONG ou clinica?")) {
      updateStatus.mutate({ id, status: VerificationStatus.BLOCKED });
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        !selectedProvider ||
        isModalOpen ||
        target?.tagName === "INPUT" ||
        target?.getAttribute("role") === "combobox"
      ) {
        return;
      }
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        handleApprove(selectedProvider.id);
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        setIsModalOpen(true);
      }
      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        handleBlock(selectedProvider.id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, selectedProvider]);

  const documentsCount = queue.filter((provider) => provider.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD).length;
  const reviewCount = queue.filter((provider) => provider.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW).length;
  const oldestItem = queue.reduce<Provider | null>(
    (oldest, provider) => (!oldest || new Date(provider.createdAt) < new Date(oldest.createdAt) ? provider : oldest),
    null,
  );

  const selectProvider = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    if (window.innerWidth < 1280) setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="ml-72 flex-1 overflow-hidden">
        <Header
          title="Verificacao de ONGs"
          subtitle="Central operacional para validar cadastro, documentos e confianca da rede."
        />

        <main className="scrollbar-premium flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Trust onboarding</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900">Fila de verificacao em tempo real</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Revisao ativa
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Na fila" value={String(queue.length)} detail="Aguardando decisao" icon={Building2} gradient="from-slate-700 to-slate-950" delay={0} />
            <MetricCard title="Documentos" value={String(documentsCount)} detail="Pendencia documental" icon={FileText} gradient="from-amber-400 to-orange-500" delay={0.05} />
            <MetricCard title="Revisao manual" value={String(reviewCount)} detail="Prioridade elevada" icon={Eye} gradient="from-orange-500 to-red-500" delay={0.1} />
            <MetricCard title="Mais antigo" value={oldestItem ? formatElapsed(oldestItem.createdAt) : "-"} detail="Tempo maximo em fila" icon={Clock3} gradient="from-emerald-500 to-emerald-600" delay={0.15} />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 overflow-hidden border border-gray-100 bg-white shadow-sm xl:col-span-7">
              <div className="border-b border-gray-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fila de avaliacao</p>
                    <p className="mt-1 text-sm text-gray-500">{filteredQueue.length} cadastros na visao atual</p>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: QueueFilter) => setStatusFilter(value)}>
                    <SelectTrigger className="h-10 w-48 rounded-xl border-gray-200 bg-slate-50">
                      <SelectValue placeholder="Etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as etapas</SelectItem>
                      {Object.entries(statusPresentation).map(([value, status]) => (
                        <SelectItem key={value} value={value}>{status?.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar ONG, email, CNPJ ou cidade..."
                    className="h-11 rounded-xl border-gray-200 bg-slate-50 pl-10"
                  />
                </div>
              </div>

              <div className="scrollbar-premium max-h-[650px] space-y-3 overflow-y-auto p-4">
                {isLoading ? (
                  [...Array(4)].map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
                ) : isError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    Erro ao carregar a fila: {error?.message}
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                    <ShieldCheck size={32} className="text-gray-300" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Fila sem pendencias</p>
                    <p className="mt-1 text-sm text-gray-500">Nenhuma ONG corresponde aos filtros atuais.</p>
                  </div>
                ) : (
                  filteredQueue.map((provider, index) => {
                    const status = getStatus(provider);
                    const StatusIcon = status.icon;
                    const selected = selectedProviderId === provider.id;
                    return (
                      <motion.button
                        key={provider.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.18) }}
                        onClick={() => selectProvider(provider)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                          selected
                            ? "border-emerald-200 bg-emerald-50/60 shadow-sm"
                            : "border-gray-100 bg-white hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${status.gradient}`}>
                            <StatusIcon size={18} className="text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-gray-950">{getProviderName(provider)}</p>
                              <Badge className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.badge}`}>
                                {status.priority}
                              </Badge>
                            </div>
                            <p className="mt-1 truncate text-sm text-gray-600">{provider.email}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500">
                              <span>{provider.cnpj ? `CNPJ ${provider.cnpj}` : formatAddress(provider)}</span>
                              <span>{formatElapsed(provider.createdAt)} na fila</span>
                            </div>
                          </div>
                          <ArrowRight size={16} className={selected ? "text-emerald-600" : "text-gray-300"} />
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="col-span-5 hidden overflow-hidden border border-gray-100 bg-white shadow-sm xl:block">
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mesa de aprovacao</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Cadastro e decisao operacional</p>
              </div>
              <ProviderReviewPanel
                provider={selectedProvider}
                isUpdating={updateStatus.isPending}
                onApprove={handleApprove}
                onBlock={handleBlock}
                onOpenDossier={() => setIsModalOpen(true)}
              />
            </Card>
          </div>
        </main>
      </div>

      <VerificationModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onBlock={handleBlock}
        onProviderUpdated={(provider) => setSelectedProviderId(provider.id)}
      />
    </div>
  );
}
