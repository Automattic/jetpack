import { useQuery } from '@tanstack/react-query';
import { fetchCategories, type CategoryTerm } from '../api';

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
