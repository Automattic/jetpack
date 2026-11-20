export interface Site {
	origin: string;
	domain: string;
	adminPath: string;
}

// Query args that name a destination rather than identify content or a person.
const KEPT_PARAMS = [ 'page', 'post_type', 'source' ];

/**
 * Reduces a link to where it leads, without the IDs, query args, and site domain that would make
 * every value unique or carry content into Tracks.
 *
 * @param href - The absolute URL of the link.
 * @param site - Where the Dashboard is served from.
 * @return The destination, or undefined when the URL can't be parsed.
 */
export function getDestination( href: string, site: Site ): string | undefined {
	let url: URL;
	try {
		url = new URL( href );
	} catch {
		return undefined;
	}

	if ( url.protocol !== 'http:' && url.protocol !== 'https:' ) {
		return url.protocol;
	}

	const params = new URLSearchParams();
	for ( const name of KEPT_PARAMS ) {
		const value = url.searchParams.get( name );
		if ( value ) {
			params.set( name, value );
		}
	}
	const query = params.toString() ? `?${ params }` : '';

	if ( url.origin === site.origin || url.hostname === site.domain ) {
		if ( ! url.pathname.startsWith( site.adminPath ) ) {
			return 'site';
		}
		return ( url.pathname.slice( site.adminPath.length ) || 'index.php' ) + query;
	}

	const path = url.pathname
		.split( '/' )
		.map( segment => {
			if ( segment === site.domain ) {
				return ':site';
			}
			return /^\d+$/.test( segment ) ? ':id' : segment;
		} )
		.join( '/' )
		.replace( /\/$/, '' );

	return url.hostname + path + query;
}
