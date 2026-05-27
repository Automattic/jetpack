/**
 * `useCategorySummary` — the unified hook every `<CategoryCard>` consumes.
 *
 * Picks the per-source adapter from `src/lib/category-adapters.ts` based
 * on the category's `fetch.kind` in `category-config.ts`. The card sees
 * one shape (`CategorySummary`) regardless of where the data came from.
 *
 * Rules-of-hooks note: each `<CategoryCard>` is keyed by a stable category
 * id, so the switch below resolves to the same adapter per render. This
 * is the explicit trade-off the plan documented — if a single card ever
 * needed to swap categories at runtime, the switch would need to collapse
 * into one adapter call with conditional `enabled` flags.
 */
import {
	useBlackboxCategoryAdapter,
	useCommentsCategoryAdapter,
	useWooCommerceCategoryAdapter,
	type AdapterResult,
	type CategorySummary,
} from '@/lib/category-adapters';
import { CATEGORIES, type CategoryId } from '@/routes/overview/category-config';
import type { StatsInterval } from '@/lib/types';

export type { CategorySummary };

/**
 * Resolve a category id + interval into the shared `CategorySummary`
 * shape via the matching adapter.
 *
 * @param id       - Stable category id (must exist in CATEGORIES).
 * @param interval - Window the summary covers.
 * @return Adapter result.
 */
export function useCategorySummary( id: CategoryId, interval: StatsInterval ): AdapterResult {
	const def = CATEGORIES.find( c => c.id === id );
	if ( ! def ) {
		throw new Error( `Unknown category: ${ id }` );
	}

	switch ( def.fetch.kind ) {
		case 'akismet-stats':
			return useCommentsCategoryAdapter( interval );
		case 'blackbox-aggregates':
			return useBlackboxCategoryAdapter( def.fetch.category, interval );
		case 'woocommerce-fraud':
			return useWooCommerceCategoryAdapter( interval );
	}
}
