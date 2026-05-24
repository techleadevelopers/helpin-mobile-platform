import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Calendar,
  Edit,
  Mail,
  MessageCircle,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { deleteUser, fetchClientById, fetchClients, sendNotification, updateClientProfile } from "@/lib/api";
import type { Address, Client } from "@/lib/types";

type ClientEditModalProps = {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

const money = (value?: number | null) =>
  Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "Sem registro";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Sem registro";

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "Agora";
  if (diffInMinutes < 60) return `${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} h`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} d`;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "inactive":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "blocked":
      return "border-red-200 bg-red-100 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
}

function getRoleBadge(role?: string) {
  switch (role) {
    case "PROVIDER":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "ADMIN":
      return "border-violet-200 bg-violet-100 text-violet-700";
    default:
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
}

function getVerificationBadge(status?: string | null) {
  switch (status) {
    case "VERIFIED":
    case "APPROVED":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "PENDING_MANUAL_REVIEW":
    case "PENDING_DOCUMENTS_UPLOAD":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "REJECTED":
      return "border-red-200 bg-red-100 text-red-700";
    default:
      return "border-gray-200 bg-gray-100 text-gray-700";
  }
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

function UserAvatar({ user, sizeClass = "h-10 w-10" }: { user: Client; sizeClass?: string }) {
  const label = user.name || user.email || "Usuario";

  return (
    <Avatar className={`${sizeClass} border border-gray-100 bg-slate-100`}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={label} className="object-cover" />}
      <AvatarFallback className="bg-slate-100 text-xs font-semibold text-gray-700">
        {getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}

const ClientEditModal = ({ clientId, isOpen, onClose }: ClientEditModalProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [addressData, setAddressData] = useState<Partial<Address>>({});

  const { data: client, isLoading, isError, error } = useQuery<Client, Error>({
    queryKey: ["/clients", clientId],
    queryFn: () => fetchClientById(clientId!),
    enabled: !!clientId && isOpen,
  });

  useEffect(() => {
    if (!client) return;
    const dob =
      client.dateOfBirth && client.dateOfBirth.includes("T")
        ? client.dateOfBirth.split("T")[0]
        : client.dateOfBirth || "";
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      cpf: client.cpf,
      dateOfBirth: dob,
    });
    setAddressData(client.address ?? {});
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => updateClientProfile(clientId!, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ["/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/clients", updatedClient.id] });
      toast({ title: "Perfil atualizado", description: "Os dados do usuario foram salvos.", variant: "success" });
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao atualizar",
        description: err?.message || "Nao foi possivel atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setAddressData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    updateClientMutation.mutate({ ...formData, address: addressData as Address });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Dados basicos de conta e endereco.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">Carregando dados...</div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-red-600">Erro: {error?.message}</div>
        ) : client ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field id="name" label="Nome" value={formData.name || ""} onChange={handleFormChange} />
              <Field id="email" label="Email" value={formData.email || ""} onChange={handleFormChange} disabled />
              <Field id="phone" label="Telefone" value={formData.phone || ""} onChange={handleFormChange} />
              <Field id="cpf" label="CPF" value={formData.cpf || ""} onChange={handleFormChange} />
              <Field id="dateOfBirth" label="Nascimento" type="date" value={formData.dateOfBirth || ""} onChange={handleFormChange} />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50/70 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Endereco</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field id="cep" label="CEP" value={addressData.cep || ""} onChange={handleAddressChange} />
                <Field id="street" label="Rua" value={addressData.street || ""} onChange={handleAddressChange} />
                <Field id="number" label="Numero" value={addressData.number || ""} onChange={handleAddressChange} />
                <Field id="neighborhood" label="Bairro" value={addressData.neighborhood || ""} onChange={handleAddressChange} />
                <Field id="city" label="Cidade" value={addressData.city || ""} onChange={handleAddressChange} />
                <Field id="state" label="Estado" value={addressData.state || ""} onChange={handleAddressChange} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={updateClientMutation.isPending}>
                {updateClientMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-gray-600">{label}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} disabled={disabled} className="h-9 rounded-xl" />
    </div>
  );
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading, isError, error } = useQuery<Client[], Error>({
    queryKey: ["/clients"],
    queryFn: () => fetchClients(),
  });

  const filteredClients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch =
        !normalized ||
        (client.name || "").toLowerCase().includes(normalized) ||
        (client.email || "").toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const providerUsers = filteredClients.filter((user) => user.role === "PROVIDER");
  const clientUsers = filteredClients.filter((user) => user.role !== "PROVIDER");
  const riskUsers = filteredClients.filter((user) => user.status === "blocked" || user.noShowCount > 0 || user.cancellationCount > 0);

  const stats = {
    total: clients.length,
    active: clients.filter((client) => client.status === "active").length,
    blocked: clients.filter((client) => client.status === "blocked").length,
    pending: clients.filter((client) =>
      ["PENDING_MANUAL_REVIEW", "PENDING_DOCUMENTS_UPLOAD"].includes(client.verificationStatus ?? "")
    ).length,
  };

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/clients"] });
      toast({ title: "Usuario excluido", description: "A conta foi removida.", variant: "success" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err?.message || "Nao foi possivel excluir.", variant: "destructive" });
    },
  });

  const notifyMutation = useMutation({
    mutationFn: ({ clientId }: { clientId: string }) =>
      sendNotification({
        userId: clientId,
        title: "Atualizacao importante",
        message: "Estamos revisando seu perfil e entraremos em contato em breve.",
      }),
    onSuccess: () => {
      toast({ title: "Notificacao enviada", description: "O usuario recebeu a mensagem.", variant: "success" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao notificar", description: err?.message || "Nao foi possivel enviar.", variant: "destructive" });
    },
  });

  const handleDeleteUser = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuario?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleExportCsv = () => {
    const headers = ["Nome", "Email", "Status", "Role", "TotalGasto", "Casos", "NoShow", "Cancelamentos"];
    const rows = filteredClients.map((client) => [
      client.name ?? "",
      client.email ?? "",
      client.status ?? "",
      client.role ?? "",
      Number(client.totalSpent ?? 0).toFixed(2),
      client.completedBookingsCount ?? 0,
      client.noShowCount ?? 0,
      client.cancellationCount ?? 0,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "usuarios.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="ml-72 flex flex-1 flex-col overflow-hidden">
        <Header
          title="Usuarios e Reputacao"
          subtitle="Contas, trust, atividade e risco operacional."
        />

        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Operacao</p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900">Base de usuarios</h2>
            </div>
            <Button variant="outline" className="h-8 rounded-xl text-xs" onClick={handleExportCsv}>
              Exportar CSV
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard icon={Users} label="Total" value={stats.total} />
            <StatCard icon={Shield} label="Ativos" value={stats.active} tone="emerald" />
            <StatCard icon={UserCheck} label="Pendentes" value={stats.pending} tone="amber" />
            <StatCard icon={Ban} label="Bloqueados" value={stats.blocked} tone="red" />
          </div>

          <Card className="mb-4 border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1 xl:max-w-md">
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou email"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-9 rounded-xl border-gray-200 pl-9 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-44 rounded-xl text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <UserListSkeleton />
          ) : isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              Erro ao carregar usuarios: {error?.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <UserSection title="ONGs" users={providerUsers} onSelect={setSelectedUser} onEdit={setSelectedClientForEdit} onNotify={(id) => notifyMutation.mutate({ clientId: id })} onDelete={handleDeleteUser} />
              <UserSection title="Usuarios" users={clientUsers} onSelect={setSelectedUser} onEdit={setSelectedClientForEdit} onNotify={(id) => notifyMutation.mutate({ clientId: id })} onDelete={handleDeleteUser} />
              <UserSection title="Risco" users={riskUsers} onSelect={setSelectedUser} onEdit={setSelectedClientForEdit} onNotify={(id) => notifyMutation.mutate({ clientId: id })} onDelete={handleDeleteUser} compact />
            </div>
          )}
        </main>
      </div>

      <ClientEditModal
        clientId={selectedClientForEdit}
        isOpen={Boolean(selectedClientForEdit)}
        onClose={() => setSelectedClientForEdit(null)}
      />

      <UserOperationalDialog
        user={selectedUser}
        open={Boolean(selectedUser)}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "blue" | "emerald" | "amber" | "red";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <Card className="border border-gray-100 bg-white shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function UserSection({
  title,
  users,
  onSelect,
  onEdit,
  onNotify,
  onDelete,
  compact,
}: {
  title: string;
  users: Client[];
  onSelect: (user: Client) => void;
  onEdit: (id: string) => void;
  onNotify: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <Card className="border border-gray-100 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
            <p className="text-xs text-gray-500">{users.length} registros</p>
          </div>
          <Badge className="border-0 bg-slate-100 text-xs text-gray-600">{users.length}</Badge>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-gray-500">Nenhum registro para os filtros atuais.</p>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onSelect={onSelect}
                onEdit={onEdit}
                onNotify={onNotify}
                onDelete={onDelete}
                compact={compact}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  onSelect,
  onEdit,
  onNotify,
  onDelete,
  compact,
}: {
  user: Client;
  onSelect: (user: Client) => void;
  onEdit: (id: string) => void;
  onNotify: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const riskCount = (user.noShowCount ?? 0) + (user.cancellationCount ?? 0);

  return (
    <div
      className="cursor-pointer rounded-2xl border border-gray-100 bg-slate-50/60 p-3 transition hover:bg-white hover:shadow-sm"
      onClick={() => onSelect(user)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-gray-950">{user.name || user.email}</p>
              <Badge className={`border px-2 py-0 text-[10px] ${getStatusBadge(user.status)}`}>{user.status}</Badge>
              <Badge className={`border px-2 py-0 text-[10px] ${getRoleBadge(user.role)}`}>{user.role || "CLIENT"}</Badge>
            </div>
            <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
            {!compact && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <span>{user.completedBookingsCount ?? 0} casos</span>
                <span>R$ {money(user.totalSpent)}</span>
                <span>login {formatRelativeTime(user.lastLogin)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {riskCount > 0 && <Badge className="border border-red-100 bg-red-50 text-[10px] text-red-700">risco {riskCount}</Badge>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-blue-700"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(user.id);
            }}
          >
            <Edit size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-emerald-700"
            onClick={(event) => {
              event.stopPropagation();
              onNotify(user.userId);
            }}
          >
            <MessageCircle size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-600"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(user.id);
            }}
          >
            <Ban size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserOperationalDialog({
  user,
  open,
  onOpenChange,
}: {
  user: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!user) return null;

  const address = [
    user.address?.street,
    user.address?.number,
    user.address?.neighborhood,
    user.address?.city,
    user.address?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-0 p-0 shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <UserAvatar user={user} sizeClass="h-12 w-12" />
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold text-gray-950">{user.name || user.email}</DialogTitle>
                <DialogDescription className="mt-1 text-xs text-gray-500">Conta, reputacao e atividade operacional.</DialogDescription>
              </div>
              <Badge className={`border px-2 py-0 text-[10px] ${getVerificationBadge(user.verificationStatus)}`}>
                {(user.verificationStatus || "sem verificacao").replace(/_/g, " ").toLowerCase()}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <DetailMetric icon={Calendar} label="Casos" value={user.completedBookingsCount ?? 0} />
              <DetailMetric icon={Shield} label="Gasto total" value={`R$ ${money(user.totalSpent)}`} />
              <DetailMetric icon={Ban} label="No-show" value={user.noShowCount ?? 0} />
              <DetailMetric icon={Ban} label="Cancelamentos" value={user.cancellationCount ?? 0} />
            </div>
            <section className="mt-4 rounded-2xl border border-gray-100 bg-slate-50/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Atividade</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
                <Info label="Ultimo login" value={formatRelativeTime(user.lastLogin)} />
                <Info label="Ultima atividade" value={formatRelativeTime(user.lastActivity)} />
                <Info label="Membro desde" value={formatRelativeTime(user.createdAt)} />
                <Info label="Status" value={user.status} />
              </div>
            </section>
          </div>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contato</h3>
              <div className="mt-3 space-y-3">
                <Info icon={Mail} label="Email" value={user.email || "Nao informado"} />
                <Info label="Telefone" value={user.phone || "Nao informado"} />
              </div>
            </section>
            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Localizacao</h3>
              <div className="mt-3">
                <Info label="Endereco" value={address || "Nao informado"} />
              </div>
            </section>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>
      <p className="mt-2 truncate text-xl font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      </div>
      <p className="mt-0.5 break-words text-sm text-gray-800">{value}</p>
    </div>
  );
}

function UserListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {[...Array(3)].map((_, sectionIndex) => (
        <Card key={sectionIndex} className="border border-gray-100 bg-white shadow-sm">
          <CardContent className="space-y-3 p-4">
            {[...Array(3)].map((_, rowIndex) => (
              <div key={rowIndex} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
