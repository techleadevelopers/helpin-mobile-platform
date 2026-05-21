import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ChartLine, Users, ClipboardCheck, ChartPie, Sparkles, UsersRound, MapPin, Handshake, DollarSign, LifeBuoy, Bell, Cog, LogIn } from "lucide-react";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<any>;
  action: () => void;
  keywords?: string[];
};

export default function CommandPalette() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  // Global shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCtrlK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const nav = (path: string) => () => {
    navigate(path);
    setOpen(false);
  };

  const commands = useMemo<Cmd[]>(
    () => [
      { id: "dash", label: "Ir para Painel ZooHelp", icon: ChartLine, action: nav("/dashboard"), keywords: ["home", "overview", "painel", "ops"] },
      { id: "providers", label: "ONGs e Clínicas", icon: Users, action: nav("/providers"), keywords: ["ongs", "clinicas", "rede"] },
      { id: "verification", label: "Verificação de ONGs", icon: ClipboardCheck, action: nav("/verification-queue"), keywords: ["verificação", "review", "docs", "trust"] },
      { id: "analytics", label: "Doações e Grants", icon: ChartPie, action: nav("/financial-analytics"), keywords: ["analytics", "financeiro", "grants"] },
      { id: "services", label: "Marketplace Solidário", icon: Sparkles, action: nav("/service-management"), keywords: ["marketplace", "catalogo", "doacoes"] },
      { id: "users", label: "Usuários e Reputação", icon: UsersRound, action: nav("/user-management"), keywords: ["usuarios", "reputacao"] },
      { id: "map", label: "Mapa de Resgates", icon: MapPin, action: nav("/provider-map"), keywords: ["mapa", "geo", "resgate"] },
      { id: "disputes", label: "Moderação e Golpes", icon: Handshake, action: nav("/dispute-management"), keywords: ["suporte", "chargeback", "fraude"] },
      { id: "payments", label: "Doações e Payouts", icon: DollarSign, action: nav("/payment-management"), keywords: ["payouts", "doa��es", "doacoes"] },
      { id: "safety", label: "Trust & Safety", icon: LifeBuoy, action: nav("/safety-alerts"), keywords: ["safety", "segurança", "abuso"] },
      { id: "notifications", label: "Notificações", icon: Bell, action: nav("/notifications"), keywords: ["push", "campanhas"] },
      { id: "settings", label: "Configurações", icon: Cog, action: nav("/settings"), keywords: ["preferencias", "config"] },
      { id: "login", label: "Login", icon: LogIn, action: nav("/login"), keywords: ["auth"] },
    ], []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Busque ou navegue… (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {commands.slice(0, 7).map((c) => (
            <CommandItem key={c.id} onSelect={() => c.action()}>
              <c.icon className="mr-2" />
              <span>{c.label}</span>
              <CommandShortcut>Enter</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Operações">
          {commands.slice(7).map((c) => (
            <CommandItem key={c.id} onSelect={() => c.action()}>
              <c.icon className="mr-2" />
              <span>{c.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
