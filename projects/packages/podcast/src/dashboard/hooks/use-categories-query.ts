import { useEntityRecords } from '@wordpress/core-data';

export interface CategoryTerm {
	id: number;
	name: string;
	slug: string;
}

/**
 * Read every category term on the site via core-data's taxonomy entity.
 *
 * @return `{ data, isLoading }` matching the prior TanStack-shaped contract.
 */
export function useCategoriesQuery(): { data: CategoryTerm[]; isLoading: boolean } {
	const { records, hasResolved } = useEntityRecords< CategoryTerm >( 'taxonomy', 'category', {
		per_page: -1,
	} );
	return { data: records ?? [], isLoading: ! hasResolved };
}
