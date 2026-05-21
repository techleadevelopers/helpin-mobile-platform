import { Users, ShieldCheck, Siren, DollarSign, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
// Importa DashboardMetrics dos tipos reais
import type { DashboardMetrics } from "@/lib/types";

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Usuários ativos",
      value: metrics.activeUsers.toLocaleString(),
      change: "+12.5% no mês",
      icon: Users,
      gradient: "from-green-400 to-green-600",
      delay: 0,
    },
    {
      title: "ONGs verificadas",
      value: metrics.approvedProviders.toLocaleString(),
      change: "+8.2% no mês",
      icon: ShieldCheck,
      gradient: "from-light-blue to-medium-blue",
      delay: 0.1,
    },
    {
      title: "Resgates coordenados",
      value: metrics.servicesBooked.toLocaleString(),
      change: "+15.3% no mês",
      icon: Siren,
      gradient: "from-purple-400 to-purple-600",
      delay: 0.2,
    },
    {
      title: "Doações processadas",
      value: `R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: "+22.1% no mês",
      icon: DollarSign,
      gradient: "from-yellow-400 to-orange-500",
      delay: 0.3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: card.delay }}
        >
          <Card className="p-6 shadow-floating hover:shadow-floating-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white animate-float">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp size={14} className="mr-1" />
                  {card.change}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center`}>
                <card.icon className="text-white" size={20} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
