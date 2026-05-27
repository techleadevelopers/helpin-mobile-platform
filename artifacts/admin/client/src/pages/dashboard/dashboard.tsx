import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import ProviderMapOps from "@/components/dashboard/provider-map-ops";
import ProvidersSummary from "@/components/dashboard/providers-summary";
import RecentActivities from "@/components/dashboard/recent-activities";
import VerificationQueueWidget from "@/components/dashboard/verification-queue-widget";
import ConfigUpdates from "@/components/dashboard/config-updates";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardMetrics } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/types";

export default function Dashboard() {
  const { data: metrics, isLoading, isError, error } = useQuery<DashboardMetrics, Error>({
    queryKey: ["/admin/dashboard/metrics"],
    queryFn: fetchDashboardMetrics,
  });

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="ml-72 flex-1 overflow-hidden">
        <Header
          title="ZooHelp Ops Center"
          subtitle="Operação, trust, resgates e sistema em tempo real."
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Tempo real</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900">Operação do app</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              Sistema monitorando
            </div>
          </div>

          {isLoading ? (
            <div className="mb-5 grid grid-cols-12 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="col-span-12 h-24 rounded-2xl md:col-span-6 xl:col-span-3" />
              ))}
            </div>
          ) : isError ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <p>Erro ao carregar metricas do dashboard: {error?.message}</p>
            </div>
          ) : metrics ? (
            <div className="mb-5 grid grid-cols-12 gap-4">
              <div className="col-span-12">
                <MetricsCards metrics={metrics} />
              </div>
            </div>
          ) : null}

          <div className="mb-5 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <ProviderMapOps height={320} />
            </div>
          </div>

          <div className="mb-4 mt-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Sistema</p>
            <h2 className="mt-1 text-sm font-semibold text-gray-900">Rede, trust e receita</h2>
          </div>

          <div className="mb-5 grid grid-cols-12 gap-4">
            <div className="col-span-12 xl:col-span-7">
              <RevenueChart />
            </div>
            <div className="col-span-12 xl:col-span-5">
              <ProvidersSummary />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <RecentActivities />
            </div>
            <div className="col-span-12 space-y-4 lg:col-span-4">
              <VerificationQueueWidget />
              <ConfigUpdates />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
