/**
 * Adapter — translate a DataViews `View` into the params our `useActivity`
 * hook understands. Filters become category / outcome / source flags
 * with `'all'` defaults; `view.search` / `view.page` / `view.perPage`
 * pass through directly.
 */
import type {
	ActivityCategory,
	ActivityOutcome,
	ActivityQueryParams,
	ActivitySource,
} from './activity-types';
import type { View } from '@wordpress/dataviews';

/**
 * Look up a filter value by field id. Returns `'all'` when absent.
 *
 * @param view  - The DataViews view to inspect.
 * @param field - The field id to look up.
 * @return The filter value as a string, or `'all'`.
 */
function filterValue( view: View, field: string ): string {
	const f = ( view.filters ?? [] ).find( x => x.field === field );
	return ( f?.value as string ) ?? 'all';
}

/**
 * Convert a DataViews view into the params shape useActivity expects.
 *
 * @param view - The current DataViews view.
 * @return Activity query params with sensible defaults for unset fields.
 */
export function viewToParams( view: View ): ActivityQueryParams {
	return {
		page: view.page ?? 1,
		perPage: view.perPage ?? 25,
		category: filterValue( view, 'category' ) as ActivityCategory | 'all',
		outcome: filterValue( view, 'outcome' ) as ActivityOutcome | 'all',
		source: filterValue( view, 'source' ) as ActivitySource | 'all',
		search: view.search ?? '',
	};
}
