import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerificationStatus } from "@/lib/types";
import { Filter, LayoutGrid, List, Search } from "lucide-react";

type ProvidersToolbarProps = {
  searchTerm: string;
  statusFilter: VerificationStatus | "all";
  viewMode: "card" | "table";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: VerificationStatus | "all") => void;
  onViewModeChange: (value: "card" | "table") => void;
};

export function ProvidersToolbar({
  searchTerm,
  statusFilter,
  viewMode,
  onSearchChange,
  onStatusChange,
  onViewModeChange,
}: ProvidersToolbarProps) {
  return (
    <Card className="mb-6 shadow-floating border-0">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar ONGs e clínicas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={(value: VerificationStatus | "all") => onStatusChange(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value={VerificationStatus.APPROVED}>Aprovado</SelectItem>
                <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>RevisÃ£o Manual Pendente</SelectItem>
                <SelectItem value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}>Documentos Pendentes</SelectItem>
                <SelectItem value={VerificationStatus.REJECTED}>Rejeitado</SelectItem>
                <SelectItem value={VerificationStatus.BLOCKED}>Bloqueado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
              <Filter className="mr-2" size={16} />
              Mais Filtros
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("card")}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("table")}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
