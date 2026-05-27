/**
 * Default view + localStorage persistence for the Activity DataViews.
 *
 * Persists across reloads so a reviewer who narrows to category=logins
 * and sorts by timestamp doesn't lose the layout on refresh. The
 * persistence is best-effort — corrupt data clears to the default.
 */
import type { ActivityCategory } from './activity-types';
import type { View, ViewTable } from '@wordpress/dataviews';

export const STORAGE_KEY = 'akismet:activity:view';

/**
 * Initial view configuration. Table layout with the five fields visible
 * by default (subject, category, outcome, source, when), sorted by
 * timestamp DESC, 25 per page.
 */
export const defaultView: ViewTable = {
	type: 'table',
	fields: [ 'subject', 'category', 'outcome', 'source', 'timestamp' ],
	sort: { field: 'timestamp', direction: 'desc' },
	filters: [],
	search: '',
	page: 1,
	perPage: 25,
	layout: { density: 'balanced' },
};

/**
 * Read the persisted view from localStorage. Returns the default when
 * nothing is stored or the stored value can't be parsed.
 *
 * @return The view to render.
 */
export function loadView(): ViewTable {
	if ( typeof window === 'undefined' ) {
		return defaultView;
	}
	try {
		const raw = window.localStorage.getItem( STORAGE_KEY );
		if ( ! raw ) {
			return defaultView;
		}
		const parsed = JSON.parse( raw ) as ViewTable;
		if ( parsed && parsed.type === 'table' ) {
			return parsed;
		}
	} catch {
		// fall through to default
	}
	return defaultView;
}

/**
 * Persist a view to localStorage.
 *
 * @param view - The view to persist. Only table views are persisted —
 *             other layouts fall through silently.
 */
export function saveView( view: View ): void {
	if ( typeof window === 'undefined' ) {
		return;
	}
	if ( view.type !== 'table' ) {
		return;
	}
	try {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( view ) );
	} catch {
		// Quota / privacy mode — ignore.
	}
}

/**
 * Apply a category deep-link filter to a view (used by the Overview
 * card's "See activity →" navigation). Replaces any existing category
 * filter rather than appending so the link is idempotent.
 *
 * @param view     - Starting view.
 * @param category - Category id to pin as a filter, or null to clear.
 * @return New view with the category filter applied.
 */
export function withCategoryFilter(
	view: ViewTable,
	category: ActivityCategory | null
): ViewTable {
	const others = ( view.filters ?? [] ).filter( f => f.field !== 'category' );
	if ( ! category ) {
		return { ...view, filters: others };
	}
	return {
		...view,
		filters: [ ...others, { field: 'category', operator: 'is', value: category } ],
	};
}
