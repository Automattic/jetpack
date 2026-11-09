const REDACTED = '[redacted]';
const UNREPORTABLE = '[unreportable]';
const SAFE_NAME = /^[A-Za-z0-9_-]{1,64}$/;

const ALLOWED_PARAMS = new Set( [
	'page',
	'p',
	'from',
	'to',
	'interval',
	'preset',
	'step',
	'comp',
	'compare_from',
	'compare_to',
	'compare_preset',
	'ds',
	'section',
	'ref',
	'ref_section',
	'post_url',
	'post_id',
	'author_id',
] );

/**
 * Decodes one raw parameter name, tolerating a malformed percent sequence.
 *
 * @param raw - The name as it appears in the search string.
 * @return The decoded name.
 */
function decodeName( raw: string ): string {
	return [ ...new URLSearchParams( raw ).keys() ][ 0 ] ?? '';
}

/**
 * Keeps the value of allowlisted query parameters and masks every other value.
 *
 * A parameter whose name is unsafe is dropped rather than masked: in string form the name itself
 * is the leak, with no key left to hide it behind.
 *
 * @param search - A `location.search` value, with or without the leading `?`.
 * @return The parameters in their original order, as one query string.
 */
export function redactQuery( search: string ): string {
	const parts: string[] = [];
	const emitted = new Set< string >();
	let marked = false;

	for ( const pair of search.replace( /^\?/, '' ).split( '&' ) ) {
		if ( pair === '' ) {
			continue;
		}

		const cut = pair.indexOf( '=' );
		const name = decodeName( cut === -1 ? pair : pair.slice( 0, cut ) );

		if ( ! SAFE_NAME.test( name ) ) {
			if ( ! marked ) {
				marked = true;
				parts.push( UNREPORTABLE );
			}
			continue;
		}

		if ( emitted.has( name ) ) {
			continue;
		}
		emitted.add( name );

		const raw = cut === -1 ? '' : pair.slice( cut + 1 );
		parts.push( `${ name }=${ ALLOWED_PARAMS.has( name ) ? raw : REDACTED }` );
	}

	return parts.join( '&' );
}
