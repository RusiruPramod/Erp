import { useState, useCallback, useMemo } from 'react';
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Generic hook for server-side paginated Supabase queries with debounced search
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 20;

export interface PaginatedResult<T> {
  rows: T[];
  count: number;
}

export interface UsePaginatedQueryOptions<T> {
  /** React Query key prefix, e.g. ['customers'] */
  queryKeyPrefix: string;
  /** Supabase table or view name */
  table: string;
  /** Supabase select expression, default '*' */
  select?: string;
  /** Page size, default 20 */
  pageSize?: number;
  /** Search term (debounced externally) */
  searchTerm?: string;
  /** Columns to search with ilike, e.g. ['name','company','phone'] */
  searchColumns?: string[];
  /** Active filters as key/value pairs (eq filter) */
  filters?: Record<string, string>;
  /** Order by column */
  orderBy?: string;
  /** Order ascending, default false */
  ascending?: boolean;
  /** Extra React Query options */
  queryOptions?: Partial<UseQueryOptions<PaginatedResult<T>, Error>>;
}

export function usePaginatedQuery<T = any>(opts: UsePaginatedQueryOptions<T>) {
  const {
    queryKeyPrefix,
    table,
    select = '*',
    pageSize = DEFAULT_PAGE_SIZE,
    searchTerm = '',
    searchColumns = [],
    filters = {},
    orderBy = 'created_at',
    ascending = false,
    queryOptions = {},
  } = opts;

  const [page, setPage] = useState(1);

  // Reset to page 1 when search/filters change
  const resetPage = useCallback(() => setPage(1), []);

  const queryKey: QueryKey = useMemo(
    () => [queryKeyPrefix, searchTerm, JSON.stringify(filters), page, pageSize],
    [queryKeyPrefix, searchTerm, filters, page, pageSize]
  );

  const query = useQuery<PaginatedResult<T>, Error>({
    queryKey,
    queryFn: async (): Promise<PaginatedResult<T>> => {
      if (!isSupabaseConfigured) {
        return { rows: [], count: 0 };
      }

      let q = supabase.from(table).select(select, { count: 'exact' });

      // Apply ilike search across columns
      if (searchTerm && searchColumns.length > 0) {
        const orClause = searchColumns
          .map(col => `${col}.ilike.%${searchTerm}%`)
          .join(',');
        q = q.or(orClause);
      }

      // Apply eq filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== 'all') {
          q = q.eq(key, value);
        }
      }

      // Pagination range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await q
        .order(orderBy, { ascending })
        .range(from, to);

      if (error) throw error;
      return { rows: (data as T[]) || [], count: count || 0 };
    },
    ...queryOptions,
  });

  const totalCount = query.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rows = query.data?.rows || [];

  return {
    rows,
    totalCount,
    totalPages,
    page,
    pageSize,
    setPage,
    resetPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// Client-side pagination helper for Context-backed pages
// ---------------------------------------------------------------------------

export interface UseClientPaginationOptions<T> {
  data: T[];
  pageSize?: number;
  searchTerm?: string;
  /** Filter function applied to each item */
  filterFn?: (item: T, searchTerm: string) => boolean;
}

export function useClientPagination<T>(opts: UseClientPaginationOptions<T>) {
  const { data, pageSize = DEFAULT_PAGE_SIZE, searchTerm = '', filterFn } = opts;
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!filterFn || !searchTerm) return data;
    return data.filter(item => filterFn(item, searchTerm));
  }, [data, searchTerm, filterFn]);

  const totalCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Clamp page if data shrinks
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const from = (safePage - 1) * pageSize;
    return filteredData.slice(from, from + pageSize);
  }, [filteredData, safePage, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    rows: paginatedData,
    allFilteredRows: filteredData,
    totalCount,
    totalPages,
    page: safePage,
    pageSize,
    setPage,
    resetPage,
  };
}

