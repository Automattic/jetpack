/**
 * URL rules for the modern chassis.
 *
 * The wp-build route is `/` with `?tab=overview|settings` in the outer query,
 * owned by the chassis. Sub-pages keep today's hashes, and a recognised hash
 * wins over the tab.
 */

export const SUBPAGES = [
	'cache-debug-log',
	'critical-css-advanced',
	'getting-started',
	'purchase-successful',
] as const;

export type Subpage = ( typeof SUBPAGES )[ number ];
export type Tab = 'overview' | 'settings';

export type ModernRoute = {
	subpage: Subpage | null;
	tab: Tab;
};

export type ResolvedRoute = {
	route: ModernRoute;
	/** URL to replace the current one with, when the hash carried a tab. */
	normalizedUrl: string | null;
};

export const LOCATION_CHANGE_EVENT = 'jetpack-boost:location-change';

/**
 * Split a hash into its path and query, tolerating `#`, `#/` and trailing slashes.
 *
 * @param hash - Location hash, with or without the leading `#`.
 * @return The bare path and its parsed query.
 */
function splitHash( hash: string ): { path: string; query: URLSearchParams } {
	const [ path, query = '' ] = hash.replace( /^#/, '' ).split( '?' );

	return {
		path: path.replace( /^\//, '' ).replace( /\/$/, '' ),
		query: new URLSearchParams( query ),
	};
}

/**
 * Read the sub-page out of a hash.
 *
 * @param hash - Location hash.
 * @return The sub-page, or null for the root.
 */
export function getSubpage( hash: string ): Subpage | null {
	const { path } = splitHash( hash );

	return SUBPAGES.find( subpage => subpage === path ) ?? null;
}

/**
 * Resolve a URL to the route it shows, and to the URL it should have.
 *
 * @param href - URL to resolve. Defaults to the current location.
 * @return The route, plus a normalized URL when the hash carried a tab.
 */
export function resolveRoute( href: string = window.location.href ): ResolvedRoute {
	const url = new URL( href );
	const { path, query } = splitHash( url.hash );
	const subpage = SUBPAGES.find( candidate => candidate === path ) ?? null;

	if ( subpage ) {
		return { route: { subpage, tab: readTab( url.searchParams ) }, normalizedUrl: null };
	}

	const hashTab = readTab( query );
	if ( hashTab === 'settings' ) {
		const normalized = new URL( url );
		normalized.hash = '';
		normalized.searchParams.set( 'tab', 'settings' );

		return {
			route: { subpage: null, tab: 'settings' },
			normalizedUrl: normalized.toString(),
		};
	}

	return { route: { subpage: null, tab: readTab( url.searchParams ) }, normalizedUrl: null };
}

/**
 * Read the tab out of a query, defaulting to Overview.
 *
 * @param query - Query to read.
 * @return The tab.
 */
function readTab( query: URLSearchParams ): Tab {
	return query.get( 'tab' ) === 'settings' ? 'settings' : 'overview';
}

/**
 * Build the URL for Settings: the hash cleared, the tab set.
 *
 * @param href - URL to derive from. Defaults to the current location.
 * @return The Settings URL.
 */
export function settingsUrl( href: string = window.location.href ): string {
	const url = new URL( href );
	url.hash = '';
	url.searchParams.set( 'tab', 'settings' );

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
	if ( options.replace ) {
		window.history.replaceState( null, '', url );
	} else {
		window.history.pushState( null, '', url );
	}

	notifyLocationChange();
}
