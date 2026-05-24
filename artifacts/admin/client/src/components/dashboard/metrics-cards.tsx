import { Activity, DollarSign, ShieldCheck, Siren, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Usuarios ativos",
      value: metrics.activeUsers.toLocaleString(),
      change: "Sessao em tempo real",
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      delay: 0,
    },
    {
      title: "ONGs verificadas",
      value: metrics.approvedProviders.toLocaleString(),
      change: "Rede apta para operar",
      icon: ShieldCheck,
      gradient: "from-blue-500 to-blue-600",
      delay: 0.05,
    },
    {
      title: "Resgates coordenados",
      value: metrics.servicesBooked.toLocaleString(),
      change: "Casos coordenados",
      icon: Siren,
      gradient: "from-violet-500 to-violet-600",
      delay: 0.1,
    },
    {
      title: "Doacoes processadas",
      value: `R$ ${metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: "Fluxo financeiro",
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-500",
      delay: 0.15,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: card.delay }}
        >
          <Card className="border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">{card.value}</p>
                <p className="mt-1.5 flex items-center text-xs font-medium text-gray-500">
                  <Activity size={12} className="mr-1 text-emerald-600" />
                  {card.change}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient}`}>
                <card.icon className="text-white" size={18} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
