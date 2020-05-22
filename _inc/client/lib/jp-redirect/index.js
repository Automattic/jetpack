/**
 * Builds an URL using the jetpack.com/redirect service
 *
 * If $source is a simple slug, it will be sent using the source query parameter. e.g. jetpack.com/redirect?source=slug
 *
 * If $source is a full URL, starting with https://, it will be sent using the url query parameter. e.g. jetpack.com/redirect?url=https://wordpress.com
 *
 * Note: if using full URL, query parameters and anchor must be passed in $args. Any querystring of url fragment in the URL will be discarded.
 *
 * @since 8.5.0
 *
 * @param {string}  source The URL handler registered in the server or the full destination URL (starting with https://).
 * @param {object}  args {
 *
 * 		Additional arguments to build the url
 *
 * 		@type {string} site URL of the current site.
 * 		@type {string} path Additional path to be appended to the URL
 * 		@type {string} query Query parameters to be added to the URL
 * 		@type {string} anchor Anchor to be added to the URL
 * }
 *
 * @returns {string} The redirect URL
 */
export default function getRedirectUrl( source, args = {} ) {
	const queryVars = {};

	if ( source.search( 'https://' ) === 0 ) {
		const parsedUrl = new URL( source );

		// discard any query and fragments.
		source = `https://${ parsedUrl.host }${ parsedUrl.pathname }`;
		queryVars.url = encodeURIComponent( source );
	} else {
		queryVars.source = encodeURIComponent( source );
	}

	const acceptedArgs = [ 'site', 'path', 'query', 'anchor' ];

	Object.keys( args ).map( argName => {
		if ( acceptedArgs.includes( argName ) ) {
			queryVars[ argName ] = encodeURIComponent( args[ argName ] );
		}
	} );

	const queryString = Object.keys( queryVars )
		.map( key => key + '=' + queryVars[ key ] )
		.join( '&' );

	return `https://jetpack.com/redirect/?` + queryString;
}
