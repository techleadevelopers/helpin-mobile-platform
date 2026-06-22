import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  approveRescueFinalReport,
  fetchRescueFinalReports,
  rejectRescueFinalReport,
  type RescueFinalReportAdmin,
} from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "rescued", label: "Resgatado" },
  { value: "not_found", label: "Nao encontrado" },
  { value: "died", label: "Obito confirmado" },
  { value: "referred", label: "Encaminhado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "false_alarm", label: "Falso alerta" },
];

function ReportEditor({ report }: { report: RescueFinalReportAdmin }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState(report.status);
  const [summary, setSummary] = useState(report.summary);
  const [publicUpdate, setPublicUpdate] = useState(report.publicUpdate);
  const [rejectionReason, setRejectionReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: () => approveRescueFinalReport(report.rescueId!, { status, summary, publicUpdate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rescue-final-reports"] });
      toast({ title: "Relatorio publicado", description: "A atualizacao publica ja pode aparecer no feed." });
    },
    onError: (error: any) => toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectRescueFinalReport(report.rescueId!, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rescue-final-reports"] });
      toast({ title: "Relatorio rejeitado", description: "O rascunho foi retirado da fila de aprovacao." });
    },
    onError: (error: any) => toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" }),
  });

  const disabled = !report.rescueId || approveMutation.isPending || rejectMutation.isPending;

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-gray-950">{report.postTitle}</CardTitle>
            <p className="text-sm text-gray-500">{report.postType} · {new Date(report.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            {report.publicationStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status final</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="mb-1 h-4 w-4" />
              IA sugere. ONG/admin decide e publica.
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Resumo operacional</p>
              <Textarea value={summary} maxLength={280} onChange={(event) => setSummary(event.target.value)} />
              <p className="text-right text-xs text-gray-400">{summary.length}/280</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Atualizacao publica</p>
              <Textarea value={publicUpdate} maxLength={140} onChange={(event) => setPublicUpdate(event.target.value)} />
              <p className="text-right text-xs text-gray-400">{publicUpdate.length}/140</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <Textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Motivo da rejeicao, se precisar recusar"
              className="min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={disabled || rejectionReason.trim().length === 0}
              onClick={() => rejectMutation.mutate()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
            <Button disabled={disabled || !summary.trim() || !publicUpdate.trim()} onClick={() => approveMutation.mutate()}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar e publicar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RescueFinalReportsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["rescue-final-reports", "pending_approval"],
    queryFn: () => fetchRescueFinalReports("pending_approval"),
  });
  const pendingCount = useMemo(() => data.length, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-72">
        <Header title="Relatorios de Resgate" subtitle="Revisao humana antes da atualizacao publica" />
        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="mt-2 text-3xl font-bold text-gray-950">{pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <Card><CardContent className="p-6 text-sm text-gray-500">Carregando relatorios...</CardContent></Card>
          ) : data.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-gray-500">Nenhum relatorio pendente.</CardContent></Card>
          ) : (
            data.map((report) => <ReportEditor key={report.id} report={report} />)
          )}
        </div>
      </main>
    </div>
  );
}
