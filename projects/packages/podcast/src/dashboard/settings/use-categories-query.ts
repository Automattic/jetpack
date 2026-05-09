import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export interface CategoryTerm {
	id: number;
	name: string;
	slug: string;
}

const QUERY_KEY = [ 'jetpack-podcast', 'categories' ] as const;

const fetchCategories = async (): Promise< CategoryTerm[] > => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	const out: CategoryTerm[] = [];
	let page = 1;

	if ( isSimpleSite() && blogId ) {
		while ( true ) {
			const result = ( await apiFetch( {
				path: `/rest/v1.1/sites/${ blogId }/taxonomies/category/terms?page=${ page }&number=100`,
				method: 'GET',
			} ) ) as {
				terms?: Array< { ID: number; name: string; slug: string } >;
				found?: number;
			};
			const terms = result.terms || [];
			out.push( ...terms.map( t => ( { id: t.ID, name: t.name, slug: t.slug } ) ) );
			if ( out.length >= ( result.found || 0 ) || terms.length === 0 ) {
				break;
			}
			page++;
		}
		return out;
	}

	while ( true ) {
		const response = ( await apiFetch( {
			path: addQueryArgs( '/wp/v2/categories', { per_page: 100, page } ),
			method: 'GET',
			parse: false,
		} ) ) as Response;
		const data = ( await response.json() ) as Array< { id: number; name: string; slug: string } >;
		out.push( ...data.map( t => ( { id: t.id, name: t.name, slug: t.slug } ) ) );
		const totalPages = parseInt( response.headers.get( 'X-WP-TotalPages' ) || '1', 10 );
		if ( page >= totalPages || data.length === 0 ) {
			break;
		}
		page++;
	}
	return out;
};

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
