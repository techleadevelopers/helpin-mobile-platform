import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Scale,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchAllDisputes, fetchDisputeDetails, sendDisputeMessage, updateDisputeStatus } from "@/lib/api";
import { Dispute, DisputeStatus } from "@/lib/types";

const statusPresentation = {
  [DisputeStatus.PENDING]: {
    label: "Pendente",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
    iconStyle: "from-amber-400 to-orange-500",
  },
  [DisputeStatus.IN_REVIEW]: {
    label: "Em revisao",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    icon: FileText,
    iconStyle: "from-blue-500 to-indigo-600",
  },
  [DisputeStatus.RESOLVED]: {
    label: "Resolvida",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    iconStyle: "from-emerald-500 to-emerald-600",
  },
  [DisputeStatus.REJECTED]: {
    label: "Rejeitada",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: XCircle,
    iconStyle: "from-rose-500 to-red-600",
  },
} satisfies Record<DisputeStatus, {
  label: string;
  badge: string;
  icon: typeof Clock3;
  iconStyle: string;
}>;

const reasonLabels: Record<string, string> = {
  SERVICE_NOT_PERFORMED: "Atendimento nao realizado",
  SERVICE_INCOMPLETE: "Atendimento incompleto",
  QUALITY_ISSUES: "Qualidade reportada",
  PROVIDER_DID_NOT_SHOW: "ONG ou clinica ausente",
  CLIENT_DID_NOT_SHOW: "Solicitante ausente",
  OTHER: "Outro motivo",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const shortId = (value: string) => value.slice(0, 8).toUpperCase();

function StatusBadge({ status }: { status: DisputeStatus }) {
  const config = statusPresentation[status];
  return (
    <Badge className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.badge}`}>
      {config.label}
    </Badge>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: typeof Scale;
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

type CaseDetailProps = {
  dispute?: Dispute;
  isLoading: boolean;
  onUpdateStatus: (status: DisputeStatus, notes?: string) => void;
  onSendMessage: (content: string) => void;
  isUpdating: boolean;
  isSending: boolean;
};

function CaseDetail({
  dispute,
  isLoading,
  onUpdateStatus,
  onSendMessage,
  isUpdating,
  isSending,
}: CaseDetailProps) {
  const [status, setStatus] = useState<DisputeStatus | "">("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStatus("");
    setNotes("");
    setMessage("");
  }, [dispute?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <ShieldCheck className="text-slate-400" size={24} />
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-900">Selecione um caso</p>
        <p className="mt-1 max-w-xs text-sm text-gray-500">
          Revise evidencias, converse com as partes e tome uma decisao operacional.
        </p>
      </div>
    );
  }

  const reason = reasonLabels[dispute.reason] ?? dispute.reason.replace(/_/g, " ");

  return (
    <div className="space-y-5 p-5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Caso selecionado</p>
            <h3 className="mt-2 text-lg font-semibold">#{shortId(dispute.id)}</h3>
            <p className="mt-1 text-sm text-slate-300">{reason}</p>
          </div>
          <StatusBadge status={dispute.status} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-slate-400">Resgate</p>
            <p className="mt-1 font-semibold text-white">#{shortId(dispute.bookingId)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="text-slate-400">Aberto em</p>
            <p className="mt-1 font-semibold text-white">{formatDateTime(dispute.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Relato recebido</p>
        <p className="mt-3 text-sm leading-6 text-gray-700">{dispute.description}</p>
        {dispute.resolutionNotes && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="text-xs font-semibold uppercase tracking-wide">Decisao registrada</p>
            <p className="mt-1">{dispute.resolutionNotes}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Decisao operacional</p>
          <span className="text-[11px] text-gray-400">Atalhos: I / V / J</span>
        </div>
        <Select value={status} onValueChange={(value: DisputeStatus) => setStatus(value)}>
          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-slate-50">
            <SelectValue placeholder="Selecionar novo status" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(DisputeStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {statusPresentation[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Nota para auditoria da decisao"
          className="mt-3 h-11 rounded-xl border-gray-200 bg-slate-50"
        />
        <Button
          disabled={!status || isUpdating}
          onClick={() => status && onUpdateStatus(status, notes.trim() || undefined)}
          className="mt-3 h-11 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <ShieldCheck size={16} />
          Registrar decisao
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comunicacao do caso</p>
          <span className="text-xs font-medium text-gray-400">{dispute.messages?.length ?? 0} mensagens</span>
        </div>
        <div className="scrollbar-premium mt-3 max-h-44 space-y-3 overflow-y-auto pr-1">
          {dispute.messages?.length ? (
            dispute.messages.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between gap-3 text-[11px] font-medium text-gray-500">
                  <span>{item.sender?.name ?? `Usuario ${shortId(item.senderUserId)}`}</span>
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-gray-700">{item.content}</p>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-gray-500">Nenhuma mensagem registrada.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Enviar orientacao as partes..."
            className="h-11 rounded-xl border-gray-200 bg-slate-50"
          />
          <Button
            size="icon"
            disabled={isSending || !message.trim()}
            onClick={() => {
              onSendMessage(message.trim());
              setMessage("");
            }}
            className="h-11 w-11 shrink-0 rounded-xl bg-medium-blue text-white hover:bg-blue-700"
            aria-label="Enviar mensagem"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DisputeManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const { data: disputes = [], isLoading, isError, error } = useQuery<Dispute[], Error>({
    queryKey: ["/disputes"],
    queryFn: () => fetchAllDisputes(),
  });

  const filteredDisputes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return disputes.filter((dispute) => {
      const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        dispute.id.toLowerCase().includes(normalizedSearch) ||
        dispute.bookingId.toLowerCase().includes(normalizedSearch) ||
        dispute.description.toLowerCase().includes(normalizedSearch) ||
        dispute.reason.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [disputes, searchTerm, statusFilter]);

  useEffect(() => {
    if (!filteredDisputes.length) {
      setSelectedDisputeId(null);
      return;
    }
    if (!selectedDisputeId || !filteredDisputes.some((item) => item.id === selectedDisputeId)) {
      setSelectedDisputeId(filteredDisputes[0].id);
    }
  }, [filteredDisputes, selectedDisputeId]);

  const { data: selectedDispute, isLoading: isLoadingSelected } = useQuery<Dispute, Error>({
    queryKey: ["/disputes", selectedDisputeId],
    queryFn: () => fetchDisputeDetails(selectedDisputeId!),
    enabled: Boolean(selectedDisputeId),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: DisputeStatus; notes?: string }) =>
      updateDisputeStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/disputes"] });
      if (selectedDisputeId) {
        queryClient.invalidateQueries({ queryKey: ["/disputes", selectedDisputeId] });
      }
      toast({ title: "Decisao registrada", description: "O status do caso foi atualizado." });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Falha na decisao", description: mutationError.message, variant: "destructive" });
    },
  });

  const sendMessage = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => sendDisputeMessage(id, content),
    onSuccess: () => {
      if (selectedDisputeId) {
        queryClient.invalidateQueries({ queryKey: ["/disputes", selectedDisputeId] });
      }
      toast({ title: "Mensagem enviada", description: "A comunicacao foi registrada no caso." });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Falha no envio", description: mutationError.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        !selectedDisputeId ||
        isMobileDetailOpen ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("role") === "combobox"
      ) {
        return;
      }
      const statusByKey: Partial<Record<string, DisputeStatus>> = {
        i: DisputeStatus.IN_REVIEW,
        v: DisputeStatus.RESOLVED,
        j: DisputeStatus.REJECTED,
      };
      const nextStatus = statusByKey[event.key.toLowerCase()];
      if (nextStatus) {
        event.preventDefault();
        updateStatus.mutate({ id: selectedDisputeId, status: nextStatus });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileDetailOpen, selectedDisputeId, updateStatus]);

  const pendingCount = disputes.filter((item) => item.status === DisputeStatus.PENDING).length;
  const inReviewCount = disputes.filter((item) => item.status === DisputeStatus.IN_REVIEW).length;
  const resolvedCount = disputes.filter((item) => item.status === DisputeStatus.RESOLVED).length;
  const resolutionRate = disputes.length ? Math.round((resolvedCount / disputes.length) * 100) : 0;

  const openCase = (id: string) => {
    setSelectedDisputeId(id);
    if (window.innerWidth < 1280) {
      setIsMobileDetailOpen(true);
    }
  };

  const detailProps = {
    dispute: selectedDispute,
    isLoading: isLoadingSelected,
    isUpdating: updateStatus.isPending,
    isSending: sendMessage.isPending,
    onUpdateStatus: (status: DisputeStatus, notes?: string) => {
      if (selectedDisputeId) {
        updateStatus.mutate({ id: selectedDisputeId, status, notes });
      }
    },
    onSendMessage: (content: string) => {
      if (selectedDisputeId) {
        sendMessage.mutate({ id: selectedDisputeId, content });
      }
    },
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="ml-72 flex-1 overflow-hidden">
        <Header
          title="Moderacao e Golpes"
          subtitle="Central operacional para investigar relatos, proteger a rede e documentar decisoes."
        />

        <main className="scrollbar-premium flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Trust operations</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900">Fila de moderacao em tempo real</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Monitoramento ativo
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Casos recebidos" value={String(disputes.length)} detail="Fila operacional" icon={Scale} gradient="from-slate-700 to-slate-950" delay={0} />
            <MetricCard title="Aguardando analise" value={String(pendingCount)} detail="Exigem triagem" icon={AlertTriangle} gradient="from-amber-400 to-orange-500" delay={0.05} />
            <MetricCard title="Em revisao" value={String(inReviewCount)} detail="Investigacao ativa" icon={FileText} gradient="from-blue-500 to-indigo-600" delay={0.1} />
            <MetricCard title="Taxa resolvida" value={`${resolutionRate}%`} detail={`${resolvedCount} decisoes concluidas`} icon={ShieldCheck} gradient="from-emerald-500 to-emerald-600" delay={0.15} />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 overflow-hidden border border-gray-100 bg-white shadow-sm xl:col-span-7">
              <div className="border-b border-gray-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fila de casos</p>
                    <p className="mt-1 text-sm text-gray-500">{filteredDisputes.length} relatos na visao atual</p>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: DisputeStatus | "all") => setStatusFilter(value)}>
                    <SelectTrigger className="h-10 w-44 rounded-xl border-gray-200 bg-slate-50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {Object.values(DisputeStatus).map((value) => (
                        <SelectItem key={value} value={value}>
                          {statusPresentation[value].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por caso, resgate, motivo ou descricao..."
                    className="h-11 rounded-xl border-gray-200 bg-slate-50 pl-10"
                  />
                </div>
              </div>

              <div className="scrollbar-premium max-h-[650px] space-y-3 overflow-y-auto p-4">
                {isLoading ? (
                  [...Array(4)].map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
                ) : isError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                    Erro ao carregar casos: {error?.message}
                  </div>
                ) : filteredDisputes.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                    <MessageSquare className="text-gray-300" size={32} />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Nenhum caso encontrado</p>
                    <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou aguarde novos relatos.</p>
                  </div>
                ) : (
                  filteredDisputes.map((dispute, index) => {
                    const config = statusPresentation[dispute.status];
                    const Icon = config.icon;
                    const isSelected = selectedDisputeId === dispute.id;
                    return (
                      <motion.button
                        type="button"
                        key={dispute.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.035, 0.18) }}
                        onClick={() => openCase(dispute.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-emerald-200 bg-emerald-50/60 shadow-sm"
                            : "border-gray-100 bg-white hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.iconStyle}`}>
                            <Icon className="text-white" size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-950">Caso #{shortId(dispute.id)}</p>
                              <StatusBadge status={dispute.status} />
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm text-gray-600">
                              {reasonLabels[dispute.reason] ?? dispute.reason.replace(/_/g, " ")}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>Resgate #{shortId(dispute.bookingId)}</span>
                              <span>{formatDateTime(dispute.createdAt)}</span>
                            </div>
                          </div>
                          <ArrowRight className={`mt-3 shrink-0 ${isSelected ? "text-emerald-600" : "text-gray-300"}`} size={16} />
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="col-span-5 hidden overflow-hidden border border-gray-100 bg-white shadow-sm xl:block">
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sala de decisao</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">Analise e resposta operacional</p>
              </div>
              <CaseDetail {...detailProps} />
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isMobileDetailOpen} onOpenChange={setIsMobileDetailOpen}>
        <DialogContent className="scrollbar-premium max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl border-0 p-0 shadow-floating-lg">
          <DialogHeader className="border-b border-gray-100 px-5 py-4">
            <DialogTitle className="text-base">Analise do caso</DialogTitle>
          </DialogHeader>
          <CaseDetail {...detailProps} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
