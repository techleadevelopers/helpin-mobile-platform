import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerificationStatus } from "@/lib/types";
import { LayoutGrid, List, Search } from "lucide-react";

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
    <Card className="mb-4 border border-gray-100 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1 xl:max-w-md">
            <Input
              type="text"
              placeholder="Buscar por nome, email ou cidade"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 rounded-xl border-gray-200 pl-9 text-sm focus:border-transparent focus:ring-2 focus:ring-light-blue"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(value: VerificationStatus | "all") => onStatusChange(value)}>
              <SelectTrigger className="h-9 w-44 rounded-xl text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={VerificationStatus.APPROVED}>Aprovado</SelectItem>
                <SelectItem value={VerificationStatus.PENDING_MANUAL_REVIEW}>Revisao manual</SelectItem>
                <SelectItem value={VerificationStatus.PENDING_DOCUMENTS_UPLOAD}>Documentos pendentes</SelectItem>
                <SelectItem value={VerificationStatus.REJECTED}>Rejeitado</SelectItem>
                <SelectItem value={VerificationStatus.BLOCKED}>Bloqueado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-xl border border-gray-200 bg-slate-50 p-0.5">
              <Button
                variant={viewMode === "card" ? "outline" : "ghost"}
                size="icon"
                className="h-8 w-8 border-0"
                onClick={() => onViewModeChange("card")}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === "table" ? "outline" : "ghost"}
                size="icon"
                className="h-8 w-8 border-0"
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
