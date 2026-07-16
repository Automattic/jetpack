import { getScriptData } from '@automattic/jetpack-script-data';

export interface CategoryTerm {
	id: number;
	name: string;
	slug: string;
}

let hydrated: CategoryTerm[] | null = null;

/**
 * Read and cache the server-injected category list
 * (`window.JetpackScriptData.podcast.categories`). Caching keeps the returned
 * array reference stable across renders.
 *
 * @return The site's category terms, or an empty array when none were injected.
 */
function getHydratedCategories(): CategoryTerm[] {
	if ( hydrated === null ) {
		const injected = getScriptData()?.podcast?.categories;
		hydrated = Array.isArray( injected )
			? injected.map( ( { id, name, slug } ) => ( {
					id: Number( id ),
					name: String( name ),
					slug: String( slug ),
			  } ) )
			: [];
	}
	return hydrated;
}

/**
 * The site's category terms for the "Post category" picker.
 *
 * Served synchronously from server-injected script data, so the dropdown
 * renders populated on first paint instead of waiting on core-data's serial
 * `/wp/v2/taxonomies` → `/wp/v2/categories` fetch (a cross-origin waterfall on
 * Simple sites). Keeps the prior `{ data, isLoading }` shape for call sites.
 *
 * @return `{ data, isLoading }`.
 */
export function useCategoriesQuery(): { data: CategoryTerm[]; isLoading: boolean } {
	return { data: getHydratedCategories(), isLoading: false };
}
