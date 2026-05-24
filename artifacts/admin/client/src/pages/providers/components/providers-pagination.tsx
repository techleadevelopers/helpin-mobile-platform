import { Button } from "@/components/ui/button";

type ProvidersPaginationProps = {
  currentPage: number;
  showingEnd: number;
  showingStart: number;
  totalCount: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
};

export function ProvidersPagination({
  currentPage,
  showingEnd,
  showingStart,
  totalCount,
  totalPages,
  onNextPage,
  onPrevPage,
}: ProvidersPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 text-gray-600 shadow-sm">
      <p className="text-xs font-medium">
        {showingStart}-{showingEnd} de {totalCount} ONGs
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-8 rounded-xl px-3 text-xs"
          onClick={onPrevPage}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <span className="text-xs font-semibold text-gray-500">
          {currentPage}/{totalPages}
        </span>
        <Button
          variant="outline"
          className="h-8 rounded-xl px-3 text-xs"
          onClick={onNextPage}
          disabled={currentPage === totalPages}
        >
          Proximo
        </Button>
      </div>
    </div>
  );
}
