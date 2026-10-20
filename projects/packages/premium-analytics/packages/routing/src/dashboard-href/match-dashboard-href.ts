/**
 * Admin page the dashboard SPA is served from.
 */
export const DASHBOARD_PAGE_SLUG = 'jetpack-premium-analytics-wp-admin';

/**
 * Whether a route link and a full page load read a query alike.
 *
 * The link hands the router one string per key; the router's own parser folds a
 * repeated key into an array and reads a JSON value as such.
 *
 * @param query - The query a route path carries, without its `?`.
 * @return Whether no key repeats and no value parses as JSON.
 */
function isPlainQuery( query: string ): boolean {
	const seen = new Set< string >();

	for ( const [ key, value ] of new URLSearchParams( query ) ) {
		let isJson = true;
		try {
			JSON.parse( value );
		} catch {
			isJson = false;
		}

		if ( seen.has( key ) || isJson ) {
			return false;
		}
		seen.add( key );
	}

	return true;
}

/**
 * Resolve a widget action href to a route of this dashboard.
 *
 * It belongs here when it targets the same document and admin `page`; the route is what `p`
 * carries, its query included. A href a route navigation would deliver differently than a full
 * page load is not one: a hash, params beyond `page` and `p`, duplicates of either, a `p` that is
 * not a root-relative path, or a query the router would not read as the link hands it over.
 *
 * @param href - The href, absolute or relative.
 * @param base - Document URL the href is judged against. Defaults to the current location.
 * @return The in-app route with its query, or `null`.
 */
export function matchDashboardHref(
	href: string,
	base: string = window.location.href
): string | null {
	let url: URL;
	let baseUrl: URL;
	try {
		baseUrl = new URL( base );
		url = new URL( href, baseUrl );
	} catch {
		return null;
	}

	if ( url.origin !== baseUrl.origin || url.pathname !== baseUrl.pathname || url.hash ) {
		return null;
	}

	if ( url.searchParams.get( 'page' ) !== baseUrl.searchParams.get( 'page' ) ) {
		return null;
	}

	for ( const key of url.searchParams.keys() ) {
		if ( key !== 'page' && key !== 'p' ) {
			return null;
		}
	}

	// `get()` reads the first duplicate and PHP the last, so the two navigations would diverge.
	if ( url.searchParams.getAll( 'page' ).length > 1 || url.searchParams.getAll( 'p' ).length > 1 ) {
		return null;
	}

	const path = url.searchParams.get( 'p' ) || '/';
	const queryStart = path.indexOf( '?' );
	const pathname = queryStart === -1 ? path : path.slice( 0, queryStart );

	// The router writes a root-relative pathname into `p`; any other shape resolves elsewhere.
	if ( ! /^\/(?!\/)/.test( pathname ) || path.includes( '#' ) ) {
		return null;
	}

	if ( queryStart !== -1 && ! isPlainQuery( path.slice( queryStart + 1 ) ) ) {
		return null;
	}

	return path;
}
