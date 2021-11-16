const BASE_PROTOCOL = 'http:';
const BASE_HOST = '__domain__.invalid';
const BASE_URL = `${ BASE_PROTOCOL }//${ BASE_HOST }`;

/**
 * Given a URL or path and search terms, returns a path including the search
 * query parameter and preserving existing parameters.
 *
 * @param  {string} uri    - URL or path to modify
 * @param  {string} search - Search terms
 * @returns {string}        Path including search terms
 */
export default function buildUrl( uri, search ) {
	// URL can only represent absolute URLs, so we need to provide a base.
	const dummyUrl = new URL( uri, BASE_URL );

	if ( search ) {
		dummyUrl.searchParams.set( 's', search );
	} else {
		dummyUrl.searchParams.delete( 's' );
	}

	// Normalize to the base protocol and host, so that we can run a replace.
	dummyUrl.protocol = BASE_PROTOCOL;
	dummyUrl.host = BASE_HOST;
	dummyUrl.port = '';
	dummyUrl.username = '';
	dummyUrl.password = '';

	let formattedPath = dummyUrl.href.replace( BASE_URL, '' );
	// Remove the leading `/` if the original uri didn't have it.
	formattedPath = uri.startsWith( '/' ) ? formattedPath : formattedPath.substring( 1 );

	return formattedPath.replace( /%20/g, '+' );
}
