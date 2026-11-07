import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return <p className="px-4 py-3 text-xs text-muted-foreground">{totalElements} kết quả</p>;
  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {totalElements} kết quả · trang {page + 1}/{totalPages}
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Trang trước">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
