import { getScriptData } from '@automattic/jetpack-script-data';

export interface CategoryTerm {
	id: number;
	name: string;
	slug: string;
}

const categories: CategoryTerm[] = getScriptData()?.podcast?.categories ?? [];

/**
 * The site's category terms for the "Post category" picker.
 *
 * Read once from server-injected script data (no client-side taxonomy→terms
 * fetch), so the dropdown renders populated on first paint.
 *
 * @return The site's category terms.
 */
export function useCategoriesQuery(): CategoryTerm[] {
	return categories;
}
