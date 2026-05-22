import { MouseEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import VerificationModal from "@/components/verification/verification-modal";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { deleteProvider, fetchAdminProvidersPage } from "@/lib/api";
import { AdminProviderPage, Provider, VerificationStatus } from "@/lib/types";
import { ProvidersPagination } from "./components/providers-pagination";
import { ProvidersResults } from "./components/providers-results";
import { ProvidersToolbar } from "./components/providers-toolbar";

const pageSize = 9;

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">(VerificationStatus.APPROVED);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: adminProviderPage,
    isLoading,
    isError,
    error,
  } = useQuery<AdminProviderPage, Error>({
    queryKey: ["admin-providers", currentPage, debouncedSearchTerm, statusFilter],
    queryFn: () =>
      fetchAdminProvidersPage({
        page: currentPage,
        limit: pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        verificationStatus: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const providers = adminProviderPage?.items ?? [];
  const totalCount = adminProviderPage?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showingStart = providers.length ? (currentPage - 1) * pageSize + 1 : 0;
  const showingEnd = providers.length ? showingStart + providers.length - 1 : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const deleteProviderMutation = useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast({ title: "Conta removida", description: "ONG/Clínica excluído com sucesso.", variant: "success" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao excluir",
        description: err?.message || "Não foi possível excluir o ONG ou clínica.",
        variant: "destructive",
      });
    },
  });

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleDeleteProvider = (event: MouseEvent, providerId: string) => {
    event.stopPropagation();
    if (window.confirm("Tem certeza que deseja excluir este ONG ou clínica?")) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />

      <div className="flex-1 ml-72 overflow-hidden">
        <Header
          title="ONGs e Clínicas"
          subtitle="Gerencie e verifique os ONGs e clínicas de serviço na plataforma."
        />

        <main className="flex-1 overflow-y-auto p-8">
          <ProvidersToolbar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            viewMode={viewMode}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
            onViewModeChange={setViewMode}
          />

          <ProvidersResults
            error={error}
            isDeleting={deleteProviderMutation.isPending}
            isError={isError}
            isLoading={isLoading}
            providers={providers}
            searchTerm={searchTerm}
            viewMode={viewMode}
            onDeleteProvider={handleDeleteProvider}
            onProviderClick={handleProviderClick}
          />

          {!isLoading && providers.length > 0 && (
            <ProvidersPagination
              currentPage={currentPage}
              showingEnd={showingEnd}
              showingStart={showingStart}
              totalCount={totalCount}
              totalPages={totalPages}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
          )}
        </main>
      </div>

      <VerificationModal
        provider={selectedProvider}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProvider(null);
        }}
      />
    </div>
  );
}
