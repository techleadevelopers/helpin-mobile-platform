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
    <div className="mt-6 flex items-center justify-between text-gray-600">
      <p className="text-sm">
        Mostrando {showingStart}{showingEnd} de {totalCount} ONGs e clínicas
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="rounded-full px-4 py-2 text-sm"
          onClick={onPrevPage}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-4 py-2 text-sm"
          onClick={onNextPage}
          disabled={currentPage === totalPages}
        >
          PrÃ³ximo
        </Button>
      </div>
    </div>
  );
}
