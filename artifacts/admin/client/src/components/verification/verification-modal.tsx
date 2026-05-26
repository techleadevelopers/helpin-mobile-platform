import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileImage,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  fetchKybDocuments,
  type KybDocument,
  updateProviderStatus,
} from "@/lib/api";
import { Provider, VerificationStatus } from "@/lib/types";
import RejectionModal from "./rejection-modal";

interface VerificationModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (providerId: string) => void;
  onReject?: (providerId: string, reason: string) => void;
  onBlock?: (providerId: string) => void;
  onProviderUpdated?: (provider: Provider) => void;
}

type EvidenceType = "document_front" | "document_back" | "selfie_with_document";

const EVIDENCE_SLOTS: Array<{ type: EvidenceType; title: string; subtitle: string }> = [
  { type: "document_front", title: "RG - frente", subtitle: "Documento de identidade" },
  { type: "document_back", title: "RG - verso", subtitle: "Verso do documento" },
  { type: "selfie_with_document", title: "Foto com RG na mao", subtitle: "Prova de posse" },
];

function formatDate(value?: string | null) {
  if (!value) return "Nao informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "Nao informado";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min atras`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h atras`;
  return `${Math.floor(minutes / 1440)} d atras`;
}

function displayValue(value?: string | number | null) {
  return String(value ?? "").trim() || "Nao informado";
}

function statusLabel(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "approved":
      return "Aprovado";
    case "rejected":
      return "Rejeitado";
    case "pending_review":
    case "pending":
      return "Pendente";
    default:
      return "Recebido";
  }
}

function statusClass(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function RegistrationItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-slate-900">{displayValue(value)}</p>
    </div>
  );
}

function EvidenceCard({
  definition,
  document,
  loading,
}: {
  definition: (typeof EVIDENCE_SLOTS)[number];
  document?: KybDocument;
  loading: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{definition.title}</p>
          <p className="text-[11px] text-slate-500">{definition.subtitle}</p>
        </div>
        {document && (
          <Badge className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${statusClass(document.status)}`}>
            {statusLabel(document.status)}
          </Badge>
        )}
      </div>
      <div className="relative aspect-[4/3] bg-slate-50">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : document?.publicUrl ? (
          <img src={document.publicUrl} alt={definition.title} className="h-full w-full object-contain p-2" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <FileImage className="h-7 w-7" />
            <span className="text-xs">Arquivo nao enviado</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 text-[11px] text-slate-500">
        {document ? `Enviado em ${formatDate(document.createdAt)}` : "Sem evidencia vinculada ao cadastro"}
      </div>
    </article>
  );
}

export default function VerificationModal({
  provider,
  isOpen,
  onClose,
  onBlock,
  onProviderUpdated,
}: VerificationModalProps) {
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery<KybDocument[], Error>({
    queryKey: ["/verification/kyb-documents", provider?.id],
    queryFn: () => fetchKybDocuments(provider!.id),
    enabled: isOpen && Boolean(provider?.id),
    staleTime: 30_000,
  });

  const evidenceByType = useMemo(() => {
    const evidence = new Map<string, KybDocument>();
    (documentsQuery.data ?? []).forEach((document) => {
      if (!evidence.has(document.documentType)) evidence.set(document.documentType, document);
    });
    return evidence;
  }, [documentsQuery.data]);

  const approveMutation = useMutation({
    mutationFn: (providerId: string) => updateProviderStatus(providerId, VerificationStatus.APPROVED),
    onSuccess: (updatedProvider) => {
      toast({ title: "ONG aprovada", description: "A validacao foi concluida.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      onProviderUpdated?.(updatedProvider);
      onClose();
    },
    onError: (error: Error) => toast({ title: "Falha ao aprovar", description: error.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ providerId, reason }: { providerId: string; reason: string }) =>
      updateProviderStatus(providerId, VerificationStatus.REJECTED, reason),
    onSuccess: (updatedProvider) => {
      toast({ title: "Cadastro rejeitado", description: "A decisao foi registrada.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/verification/pending-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/providers"] });
      onProviderUpdated?.(updatedProvider);
      setIsRejectionModalOpen(false);
      onClose();
    },
    onError: (error: Error) => toast({ title: "Falha ao rejeitar", description: error.message, variant: "destructive" }),
  });

  if (!provider) return null;

  const providerName = provider.legalName || provider.fullName || provider.name || "ONG sem nome";
  const address = [
    [provider.street, provider.number].filter(Boolean).join(", "),
    provider.neighborhood,
    [provider.city, provider.state].filter(Boolean).join(" / "),
    provider.cep,
  ].filter(Boolean).join(" - ");
  const documentsCount = EVIDENCE_SLOTS.filter((entry) => evidenceByType.has(entry.type)).length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="scrollbar-premium max-h-[94vh] max-w-6xl gap-0 overflow-y-auto rounded-2xl border-0 bg-slate-50 p-0 shadow-floating-lg">
          <DialogHeader className="border-b border-slate-200 bg-white px-7 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Dossie operacional</p>
                <DialogTitle className="mt-2 text-2xl font-semibold text-slate-950">Verificacao de ONG</DialogTitle>
                <p className="mt-1 text-sm text-slate-500">Identidade do responsavel, cadastro institucional e decisao manual.</p>
              </div>
              <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                Revisao manual
              </Badge>
            </div>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 p-6"
          >
            <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-16 w-16 border border-white/10">
                    <AvatarImage src={provider.avatarUrl} alt={providerName} />
                    <AvatarFallback className="bg-emerald-900 text-emerald-100">
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Em analise</p>
                    <h3 className="mt-1 truncate text-xl font-semibold">{providerName}</h3>
                    <p className="mt-1 truncate text-sm text-slate-300">{provider.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[10px] uppercase text-slate-400">Evidencias</p>
                    <p className="mt-1 text-lg font-semibold">{documentsCount}/3</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[10px] uppercase text-slate-400">Na fila</p>
                    <p className="mt-1 text-lg font-semibold">{formatRelativeTime(provider.createdAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Documentos do responsavel</p>
                    <h4 className="mt-1 text-base font-semibold text-slate-950">Evidencias recebidas</h4>
                  </div>
                  {documentsQuery.isError && (
                    <Badge className="border border-rose-200 bg-rose-50 text-rose-700">Falha na consulta</Badge>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {EVIDENCE_SLOTS.map((definition) => (
                    <EvidenceCard
                      key={definition.type}
                      definition={definition}
                      document={evidenceByType.get(definition.type)}
                      loading={documentsQuery.isLoading}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  As imagens exibidas sao os arquivos reais vinculados ao cadastro e devem ser tratadas como informacao restrita.
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Cadastro institucional</p>
                <h4 className="mt-1 text-base font-semibold text-slate-950">Dados declarados</h4>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <RegistrationItem label="Nome da instituicao" value={provider.legalName || provider.fullName} />
                  <RegistrationItem label="CNPJ" value={provider.cnpj} />
                  <RegistrationItem label="Area de atuacao" value={provider.ongType} />
                  <RegistrationItem label="Fundacao" value={provider.foundationYear} />
                  <RegistrationItem label="Telefone" value={provider.phone || provider.userPhone} />
                  <RegistrationItem label="Email" value={provider.email} />
                </div>
                <div className="mt-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Endereco</p>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-900">{address || "Nao informado"}</p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Registro recebido em {formatDate(provider.createdAt)}
                </div>
              </section>
            </div>

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Decisao administrativa</p>
                  <p className="text-xs text-slate-500">A aprovacao libera o selo da instituicao na rede.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => approveMutation.mutate(provider.id)}
                  disabled={approveMutation.isPending}
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  {approveMutation.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                  Aprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRejectionModalOpen(true)}
                  disabled={rejectMutation.isPending}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <X />
                  Rejeitar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onBlock?.(provider.id)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Bloquear
                </Button>
              </div>
            </section>
          </motion.div>
        </DialogContent>
      </Dialog>

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={(reason) => rejectMutation.mutate({ providerId: provider.id, reason })}
        isPending={rejectMutation.isPending}
      />
    </>
  );
}
