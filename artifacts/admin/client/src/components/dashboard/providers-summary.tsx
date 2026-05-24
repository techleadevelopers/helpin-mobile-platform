import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, UserCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchProviders } from "@/lib/api";
import type { Provider } from "@/lib/types";
import { VerificationStatus } from "@/lib/types";

export default function ProvidersSummary() {
  const { data: providers = [], isLoading, isError } = useQuery<Provider[], Error>({
    queryKey: ["/providers"],
    queryFn: fetchProviders,
  });

  const { total, approved, pending, coverageAreas } = useMemo(() => {
    const total = providers.length;
    const approved = providers.filter((p) => p.verificationStatus === VerificationStatus.APPROVED).length;
    const pending = providers.filter((p) =>
      p.verificationStatus === VerificationStatus.PENDING_MANUAL_REVIEW ||
      p.verificationStatus === VerificationStatus.PENDING_DOCUMENTS_UPLOAD ||
      p.verificationStatus === VerificationStatus.PENDING_INITIAL_REVIEW ||
      p.verificationStatus === VerificationStatus.PENDING_BACKGROUND_CHECK
    ).length;
    const coverageAreas = new Set(providers.map((p) => (p.city || "").trim()).filter(Boolean)).size;
    return { total, approved, pending, coverageAreas };
  }, [providers]);

  const items = [
    { label: "Total", value: total, icon: Users, color: "text-gray-700" },
    { label: "Verificados", value: approved, icon: UserCheck, color: "text-emerald-700", badge: `${((approved / (total || 1)) * 100).toFixed(0)}%` },
    { label: "Pendentes", value: pending, icon: Clock, color: "text-amber-700" },
    { label: "Regioes", value: coverageAreas, icon: MapPin, color: "text-blue-700" },
  ];

  return (
    <Card className="border border-gray-100 bg-white shadow-sm">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold text-gray-950">Resumo da rede ZooHelp</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-sm text-red-600">Erro ao carregar resumo da rede.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-slate-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className={`mt-2 text-xl font-semibold ${item.color}`}>{item.value}</div>
                {item.badge && <Badge className="mt-1 border-0 bg-emerald-100 px-2 py-0 text-[10px] text-emerald-700">{item.badge}</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
