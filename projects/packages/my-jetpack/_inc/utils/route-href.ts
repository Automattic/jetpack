import { getMyJetpackUrl } from '@automattic/jetpack-script-data';

const parsesAsJson = ( value: string ) => {
	try {
		JSON.parse( value );
		return true;
	} catch {
		return false;
	}
};

const unquote = ( value: string ) => {
	try {
		const parsed = JSON.parse( value );
		return typeof parsed === 'string' ? parsed : value;
	} catch {
		return value;
	}
};

/**
 * The boot router's current href, read the way its history reads it, with the values it quoted unquoted.
 *
 * @return The href, such as `/features?search=1.0`.
 */
export function getRouteHref(): string {
	const url = new URL( window.location.href );
	const route = new URL( url.searchParams.get( 'p' ) || '/', url.origin );
	const query = new URLSearchParams();
	route.searchParams.forEach( ( value, key ) => query.append( key, unquote( value ) ) );
	const queryString = query.toString();

	return route.pathname + ( queryString ? `?${ queryString }` : '' ) + route.hash + url.hash;
}

/**
 * The href a link from before My Jetpack moved to the boot router (`#/add-backup?x=1`) stands for.
 *
 * Boot reads such a link as `/` plus a hash; the hash is never sent to the server, so only the page can redirect it.
 * Its values are quoted as `toRouteHref()` quotes them, since a server-built link can't.
 *
 * @param hash - A location hash.
 * @return The href, or null for any other hash, such as `#wpbody-content` or `#//host`.
 */
export function getLegacyHashHref( hash: string ): string | null {
	if ( ! /^#\/[^/\\]/.test( hash ) ) {
		return null;
	}

	const route = new URL( hash.slice( 1 ), 'http://route.invalid' );

	return toRouteHref( { pathname: route.pathname, search: route.search, hash: route.hash } );
}

/**
 * A react-router path as a boot router href.
 *
 * The boot router JSON-parses search values, so a typed `1.0` would come back as `1`; quoting such a
 * value, as the router does when it writes one, keeps it a string.
 *
 * @param path          - The path.
 * @param path.pathname - Its pathname.
 * @param path.search   - Its query, such as `?search=1.0`.
 * @param path.hash     - Its hash.
 * @return The href, such as `/features?search=%221.0%22`.
 */
export function toRouteHref( {
	pathname = '/',
	search = '',
	hash = '',
}: {
	pathname?: string;
	search?: string;
	hash?: string;
} ): string {
	const query = new URLSearchParams();
	new URLSearchParams( search ).forEach( ( value, key ) =>
		query.append( key, parsesAsJson( value ) ? JSON.stringify( value ) : value )
	);
	const queryString = query.toString();

	return pathname + ( queryString ? `?${ queryString }` : '' ) + hash;
}

/**
 * The boot router's parsed search values as a react-router query, every value a string again.
 *
 * @param search - The parsed values.
 * @return The query, such as `?skip_pricing=true`, or an empty string.
 */
export function fromRouteSearch( search: Record< string, unknown > ): string {
	const query = new URLSearchParams();
	Object.entries( search ).forEach( ( [ key, value ] ) => {
		if ( value !== undefined ) {
			query.append( key, typeof value === 'string' ? value : JSON.stringify( value ) );
		}
	} );
	const queryString = query.toString();

	return queryString ? `?${ queryString }` : '';
}

/**
 * A link to a My Jetpack route: a bare hash on My Jetpack itself, which the dashboard redirects in place, else a full URL.
 *
 * @param route - The route, such as `/add-license`.
 * @return The href.
 */
export function getMyJetpackRouteUrl( route: string ): string {
	return new URLSearchParams( window.location.search ).get( 'page' ) === 'my-jetpack'
		? `#${ route }`
		: getMyJetpackUrl( `#${ route }` );
}
