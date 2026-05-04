/**
 * TanStack Query hook for fetching all category terms.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, fetchCategories, type CategoryTerm } from '../api';

const QUERY_KEY = [ 'jetpack-podcast', 'categories' ] as const;

/**
 * Read every category term on the site as a single cached query.
 *
 * @return Query result; `data` is the array of category terms once loaded.
 */
export function useCategoriesQuery() {
	return useQuery< CategoryTerm[] >( {
		queryKey: QUERY_KEY,
		queryFn: fetchCategories,
		staleTime: 60_000,
	} );
}

/**
 * Mutation that creates a category term and adds it to the cached list.
 *
 * @return TanStack mutation; call `mutateAsync(name)` to create.
 */
export function useCreateCategory() {
	const queryClient = useQueryClient();

	return useMutation< CategoryTerm, Error, string >( {
		mutationFn: createCategory,
		onSuccess: term => {
			queryClient.setQueryData< CategoryTerm[] >( QUERY_KEY, prev =>
				prev ? [ ...prev, term ] : [ term ]
			);
		},
	} );
}
