/**
 * URL rules for the modern chassis.
 *
 * The chassis router keeps its whole route — path and query — inside the `p`
 * wp-admin query arg, so the scroll destination lives in there rather than beside it.
 * Former tabs now select the top or Settings section; sub-page hashes still take precedence.
 */

import {
	getSubpage,
	LOCATION_CHANGE_EVENT,
	splitHash,
} from '../../../../../../_inc/runtime-contract';
import type { Subpage, Tab } from '../../../../../../_inc/runtime-contract';

const ROUTE_ARG = 'p';

export type ModernRoute = {
	subpage: Subpage | null;
	tab: Tab;
};

export type ResolvedRoute = {
	route: ModernRoute;
	/** Tidied URL to replaceState onto when a former dashboard hash needs normalization. */
	normalizedUrl: string | null;
};

/**
 * Resolve a URL to the route it shows.
 *
 * @param href - URL to resolve. Defaults to the current location.
 * @return The route, plus a normalized URL for a former dashboard hash.
 */
export function resolveRoute( href: string = window.location.href ): ResolvedRoute {
	const url = new URL( href );
	const subpage = getSubpage( url.hash );

	if ( subpage ) {
		return { route: { subpage, tab: readTab( url.searchParams ) }, normalizedUrl: null };
	}

	const { path, query } = splitHash( url.hash );
	if ( ! path && query.get( 'tab' ) === 'overview' ) {
		url.hash = '';
		url.searchParams.set( ROUTE_ARG, '/' );
		return { route: { subpage: null, tab: 'overview' }, normalizedUrl: url.toString() };
	}
	if ( ! path && ( url.hash === '#/' || query.get( 'tab' ) === 'settings' ) ) {
		return {
			route: { subpage: null, tab: 'settings' },
			normalizedUrl: settingsUrl( url.toString() ),
		};
	}

	return { route: { subpage: null, tab: readTab( url.searchParams ) }, normalizedUrl: null };
}

/**
 * Read the scroll destination from a retained tab query, defaulting to Overview.
 *
 * @param query - Query to read.
 * @return The scroll destination.
 */
function tabFromQuery( query: URLSearchParams ): Tab {
	return query.get( 'tab' ) === 'settings' ? 'settings' : 'overview';
}

/**
 * Read the scroll destination from the route query's retained tab parameter.
 *
 * @param search - Query holding the route arg.
 * @return The scroll destination.
 */
function readTab( search: URLSearchParams ): Tab {
	return tabFromQuery( splitHash( search.get( ROUTE_ARG ) ?? '' ).query );
}

/**
 * Build the Settings section URL, preserving the former tab URL contract.
 *
 * @param href - URL to derive from. Defaults to the current location.
 * @return The Settings URL.
 */
export function settingsUrl( href: string = window.location.href ): string {
	const url = new URL( href );
	url.hash = '';
	url.searchParams.set( ROUTE_ARG, '/?tab=settings' );

	return url.toString();
}

/**
 * Build the hash that links to a sub-page. Identical in both modes.
 *
 * @param subpage - Sub-page to link to.
 * @return The hash href.
 */
export function subpageHref( subpage: Subpage ): string {
	return `#/${ subpage }`;
}

/**
 * Build the URL for a sub-page, keeping the outer query.
 *
 * @param subpage - Sub-page to link to.
 * @param href    - URL to derive from. Defaults to the current location.
 * @return The sub-page URL.
 */
export function subpageUrl( subpage: Subpage, href: string = window.location.href ): string {
	const url = new URL( href );
	url.hash = subpageHref( subpage );

	return url.toString();
}

/**
 * Tell every listener the URL changed.
 *
 * The chassis wraps `history` and dispatches this too, so a handler may run
 * twice for one navigation and must be idempotent.
 */
export function notifyLocationChange(): void {
	window.dispatchEvent( new Event( LOCATION_CHANGE_EVENT ) );
}

/**
 * Navigate to a URL without a reload.
 *
 * @param url             - Destination.
 * @param options         - Navigation options.
 * @param options.replace - Replace the current entry instead of pushing one.
 */
export function navigateTo( url: string, options: { replace?: boolean } = {} ): void {
	if ( url === window.location.href ) {
		return;
	}

	if ( options.replace ) {
		window.history.replaceState( null, '', url );
	} else {
		window.history.pushState( null, '', url );
	}

	notifyLocationChange();
}
