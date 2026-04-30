import {
	DEFAULT_SEARCH_DASHBOARD_TAB,
	SEARCH_DASHBOARD_TAB_PLAN_USAGE,
	SEARCH_DASHBOARD_TABS,
} from './constants';

/**
 * Coerce an arbitrary value into a known dashboard tab identifier.
 *
 * @param {string} tab - Candidate tab id.
 * @return {string} A valid tab id (falls back to the default).
 */
export function normalizeSearchDashboardTab( tab ) {
	return SEARCH_DASHBOARD_TABS.includes( tab ) ? tab : DEFAULT_SEARCH_DASHBOARD_TAB;
}

/**
 * Resolve which dashboard tab to show from a URL query string.
 *
 * Honors `?tab=…` first, then opens Plan & usage when checkout returns with
 * `?just_upgraded=1`, otherwise falls back to the default tab.
 *
 * @param {string} [search] - URL search string (defaults to current location).
 * @return {string} Tab id to render.
 */
export function getSearchDashboardTabFromSearch( search = window.location.search ) {
	const params = new URLSearchParams( search );
	const tab = params.get( 'tab' );

	if ( SEARCH_DASHBOARD_TABS.includes( tab ) ) {
		return tab;
	}

	if ( params.has( 'just_upgraded' ) ) {
		return SEARCH_DASHBOARD_TAB_PLAN_USAGE;
	}

	return DEFAULT_SEARCH_DASHBOARD_TAB;
}

/**
 * Build a URL that selects the given tab while preserving other query params.
 *
 * @param {string} tab    - Target tab id (will be normalized).
 * @param {string} [href] - Base URL (defaults to current location).
 * @return {string} URL with the `tab` param set.
 */
export function getSearchDashboardTabUrl( tab, href = window.location.href ) {
	const url = new URL( href );
	url.searchParams.set( 'tab', normalizeSearchDashboardTab( tab ) );

	return url.toString();
}
