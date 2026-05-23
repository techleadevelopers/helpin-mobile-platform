import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Database,
  ExternalLink,
  Gauge,
  Network,
  RadioTower,
  Server,
  Users,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL, fetchAdminHealth } from "@/lib/api";
import type {
  ObservabilityHealthPayload,
  ObservabilityLatencyPoint,
  ObservabilitySentryData,
  ObservabilitySentryError,
  ObservabilitySentryIssue,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatLatency = (value?: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(0)} ms`;
  }

  return "0 ms";
};

const formatLatencyValue = (value?: number) =>
  typeof value === "number" ? `${value.toFixed(0)} ms` : "-";

const formatStatus = (value?: string) =>
  value ? value.replaceAll("_", " ") : "nao informado";

const formatUptime = (seconds?: number) => {
  if (!seconds || seconds < 0) {
    return "0 min";
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

export const buildLatencyChartData = (
  series?: ObservabilityLatencyPoint[],
) => {
  if (!series) {
    return [];
  }

  return series.map((point) => ({
    label: timeLabel(point.timestamp),
    registerLatency:
      point.registerLatency !== undefined ? point.registerLatency : null,
    radiusLatency: point.radiusLatency ?? null,
    bookingLatency: point.bookingLatency ?? null,
    paymentLatency: point.paymentLatency ?? null,
    criticalAverage: point.criticalAverage ?? null,
  }));
};

const isSentryData = (
  value?: ObservabilitySentryData | ObservabilitySentryError,
): value is ObservabilitySentryData => {
  return Boolean(value && "totalUnresolved" in value);
};

export default function ObservabilityPage() {
  const { data, isLoading, isError, error } = useQuery<
    ObservabilityHealthPayload,
    Error
  >({
    queryKey: ["/v1/observability"],
    queryFn: fetchAdminHealth,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });

  const chartData = useMemo(
    () => buildLatencyChartData(data?.latencySeries),
    [data],
  );

  const systemStatusUp = data?.status === "ok" && data?.db?.status === "up";
  const sentryInfo = data?.sentry;
  const sentryData =
    sentryInfo && isSentryData(sentryInfo) ? sentryInfo : undefined;
  const sentryError =
    sentryInfo && !isSentryData(sentryInfo) ? sentryInfo.error : undefined;
  const hasSentryData = Boolean(sentryData);
  const activeSessionCount =
    data?.activeSessions ?? data?.activeRescueSessions ?? 0;
  const metricsHref = `${API_BASE_URL}/metrics`;
  const observabilityHref = `${API_BASE_URL}/v1/observability`;
  const grafanaHref = "http://localhost:3001/d/zoohelp-core-overview";

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="Observabilidade"
          subtitle="Saude operacional real da API, filas, banco, Prometheus, Grafana e tracing."
        />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {isError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              Erro ao carregar observabilidade: {error?.message}
            </div>
          )}

          <section className="grid grid-cols-12 gap-6">
            <StatusCard
              className={
                systemStatusUp
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }
              icon={<Server className="h-5 w-5" />}
              title="Status do Sistema"
              value={systemStatusUp ? "Online" : "Degradado"}
              lines={[
                `API: ${formatLatency(data?.apiLatencyMs)}`,
                `DB: ${formatLatency(data?.db?.latencyMs)}`,
                `Uptime: ${formatUptime(data?.runtime?.uptimeSeconds)}`,
                `Pool DB: ${data?.db?.idleConnections ?? 0} idle / ${
                  data?.db?.poolSize ?? 0
                } abertas`,
              ]}
            />

            <StatusCard
              icon={<Activity className="h-5 w-5 text-pink-500" />}
              title="Crashes Sentry"
              value={
                hasSentryData && sentryData?.totalUnresolved !== null
                  ? String(sentryData?.totalUnresolved)
                  : sentryError
                    ? "Erro"
                    : "-"
              }
              lines={[
                `Android: ${hasSentryData ? sentryData?.byPlatform.android : "-"}`,
                `iOS: ${hasSentryData ? sentryData?.byPlatform.ios : "-"}`,
                sentryData?.configured
                  ? "Sentry configurado"
                  : "Sentry sem DSN configurado",
              ]}
            />

            <StatusCard
              icon={<Users className="h-5 w-5 text-sky-500" />}
              title="Sessoes Ativas"
              value={String(activeSessionCount)}
              lines={[
                `Resgates ativos: ${data?.activeRescueSessions ?? 0}`,
                `Salas de chat: ${data?.activeChatRooms ?? 0}`,
                `Ambiente: ${data?.runtime?.appEnv ?? "-"}`,
              ]}
            />

            <StatusCard
              icon={<RadioTower className="h-5 w-5 text-indigo-500" />}
              title="Filas Criticas"
              value={String(data?.queues?.deadLetterPushJobs ?? 0)}
              lines={[
                `Push queued: ${data?.queues?.queuedPushJobs ?? 0}`,
                `Moderacao queued: ${data?.queues?.queuedModerationJobs ?? 0}`,
                "Valor principal: Push DLQ",
              ]}
            />
          </section>

          <section className="grid grid-cols-12 gap-6">
            <EvidenceCard
              icon={<Gauge className="h-5 w-5 text-emerald-500" />}
              title="Prometheus"
              value={formatStatus(data?.stack?.prometheus)}
              href={metricsHref}
              linkLabel="Abrir /metrics"
            />
            <EvidenceCard
              icon={<Activity className="h-5 w-5 text-orange-500" />}
              title="Grafana"
              value={data?.links?.grafanaDashboardUid ?? "zoohelp-core-overview"}
              href={grafanaHref}
              linkLabel="Abrir dashboard"
            />
            <EvidenceCard
              icon={<Network className="h-5 w-5 text-violet-500" />}
              title="OpenTelemetry"
              value={formatStatus(data?.stack?.opentelemetry)}
              detail={data?.stack?.otlpEndpoint ?? "OTLP desativado"}
            />
            <EvidenceCard
              icon={<Database className="h-5 w-5 text-sky-500" />}
              title="Evidencia API"
              value={data?.links?.prometheusJob ?? "zoohelp-backend"}
              href={observabilityHref}
              linkLabel="Abrir JSON"
            />
          </section>

          <section className="grid grid-cols-12 gap-6">
            <MetricPanel
              title="Latencia DB"
              value={formatLatencyValue(data?.db?.latencyMs)}
              description="SELECT 1 medido pelo backend em tempo real."
            />
            <MetricPanel
              title="Busca por Proximidade"
              value={formatLatencyValue(data?.latencyAverages?.radiusLatency)}
              description="Proxy operacional para latencia de banco enquanto nao ha serie historica."
            />
          </section>

          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 xl:col-span-8">
              <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    Grafico de Latencia
                  </p>
                  <p className="text-xs text-gray-500">
                    Series reais aparecem quando o backend persistir historico de
                    latencia. O endpoint atual ja expoe snapshot e Prometheus.
                  </p>
                </div>
                <div className="mt-6 h-64">
                  {isLoading ? (
                    <Skeleton className="h-full rounded-2xl" />
                  ) : chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Sem serie historica registrada. Use Prometheus/Grafana para
                      historico real.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(value) => `${value} ms`}
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            value !== null && value !== undefined
                              ? [`${value.toFixed(1)} ms`, "Latencia"]
                              : ["-", "Latencia"]
                          }
                          labelFormatter={(label) => `Hora: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="registerLatency"
                          stroke="#22c55e"
                          name="Cadastro"
                          strokeWidth={3}
                          dot={false}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="radiusLatency"
                          stroke="#2563eb"
                          name="Busca por Proximidade"
                          strokeWidth={3}
                          dot={false}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="criticalAverage"
                          stroke="#6b7280"
                          name="Media Critica"
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="5 5"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4">
              <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide">
                  Logs de Erro
                </p>
                <div className="mt-4 space-y-4 overflow-y-auto">
                  {hasSentryData && sentryData?.recentIssues?.length ? (
                    sentryData.recentIssues.map(
                      (issue: ObservabilitySentryIssue) => (
                        <div
                          key={issue.id}
                          className="space-y-1 rounded-xl border border-gray-100 bg-gray-50 p-4"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {issue.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Plataforma: {issue.platform} | Ultima ocorrencia:{" "}
                            {timeLabel(issue.lastSeen)}
                          </p>
                          {issue.stackTrace && (
                            <details className="mt-2 text-xs text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700">
                                Ver stack trace
                              </summary>
                              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[11px] text-gray-600">
                                {issue.stackTrace}
                              </pre>
                            </details>
                          )}
                        </div>
                      ),
                    )
                  ) : sentryError ? (
                    <p className="text-sm text-red-500">
                      {sentryError.statusCode
                        ? `Erro ${sentryError.statusCode}: ${sentryError.message}`
                        : `Erro: ${sentryError.message}`}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhum erro nao resolvido disponivel no momento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type StatusCardProps = {
  title: string;
  value: string;
  lines: string[];
  icon: ReactNode;
  className?: string;
};

function StatusCard({
  title,
  value,
  lines,
  icon,
  className,
}: StatusCardProps) {
  return (
    <div className="col-span-12 md:col-span-6 xl:col-span-3">
      <div
        className={cn(
          "flex h-full flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </div>
          {icon}
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <div className="space-y-1 text-sm text-gray-600">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

type EvidenceCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  detail?: string;
  href?: string;
  linkLabel?: string;
};

function EvidenceCard({
  title,
  value,
  icon,
  detail,
  href,
  linkLabel,
}: EvidenceCardProps) {
  return (
    <div className="col-span-12 md:col-span-6 xl:col-span-3">
      <div className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wide">
            {title}
          </div>
          {icon}
        </div>
        <p className="text-sm font-semibold">{value}</p>
        {detail && <p className="break-all text-xs text-gray-500">{detail}</p>}
        {href && linkLabel && (
          <a
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-700"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {linkLabel} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

type MetricPanelProps = {
  title: string;
  value: string;
  description: string;
};

function MetricPanel({ title, value, description }: MetricPanelProps) {
  return (
    <div className="col-span-12 md:col-span-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}
