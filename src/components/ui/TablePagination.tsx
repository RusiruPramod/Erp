import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Show a loading spinner / subtle indication */
  isFetching?: boolean;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  isFetching,
}) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-2 pt-3 pb-1 text-xs text-neutral-500">
      <p className="select-none">
        Showing{' '}
        <span className="font-semibold text-neutral-700">{from}–{to}</span>{' '}
        of <span className="font-semibold text-neutral-700">{totalCount}</span>
        {isFetching && (
          <span className="ml-2 inline-block w-3 h-3 border-2 border-neutral-300 border-t-[#FF8C00] rounded-full animate-spin align-text-bottom" />
        )}
      </p>
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          title="First page"
          className="hidden sm:inline-flex"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        {/* Prev */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {/* Page indicator */}
        <span className="px-3 py-1 font-semibold text-neutral-800 select-none tabular-nums">
          {page} / {totalPages}
        </span>
        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          title="Last page"
          className="hidden sm:inline-flex"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

