import { encodeMasked, maskEmails } from './mask-emails';

const REDACTED = '[redacted]';
const UNREPORTABLE = '[unreportable]';
const SAFE_NAME = /^[A-Za-z0-9_-]{1,64}$/;
const NESTED_QUERY_PARAMS = new Set( [ 'p', 'post_url' ] );

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
 * Decodes one raw parameter value, tolerating a malformed percent sequence.
 *
 * @param raw - The value as it appears in the search string.
 * @return The decoded value.
 */
function decodeValue( raw: string ): string {
	return new URLSearchParams( `v=${ raw }` ).get( 'v' ) ?? '';
}

// Of any scheme or none, so a protocol-relative URL is covered too.
const URL_CREDENTIALS = /^([A-Za-z][A-Za-z0-9+.-]*:\/\/|\/\/)[^/?#]*@/;

/**
 * Removes the credentials a URL can carry in front of its host.
 *
 * @param url - A URL, absolute or protocol-relative.
 * @return The URL without them.
 */
export function stripUrlCredentials( url: string ): string {
	return url.replace( URL_CREDENTIALS, '$1' );
}

/**
 * The pathname of a route path, without the query or the fragment it may carry.
 *
 * @param path - A route path, as the `p` parameter carries it.
 * @return The pathname alone.
 */
export function routePathname( path: string ): string {
	return path.split( /[?#]/, 1 )[ 0 ];
}

/**
 * Masks the email addresses an allowlisted value carries.
 *
 * On the decoded value, because an address reaches a link as `%40` as readily as `@`, and the
 * allowlist keeps a value exactly as the link wrote it.
 *
 * @param raw - The value as it appears in the search string.
 * @return The value with each address masked, unchanged when it carries none.
 */
function redactAllowedValue( raw: string ): string {
	const decoded = decodeValue( raw );
	const masked = maskEmails( decoded );

	return masked === decoded ? raw : encodeMasked( masked );
}

/**
 * Redacts the query an allowlisted path or URL carries, by the rules of the page's own query.
 *
 * That query is a second search string nested inside one parameter value, so without this it
 * would reach the report whole, with none of its own names checked against the allowlist.
 *
 * @param raw - The path or URL as it appears in the search string.
 * @return The value with its query redacted and its fragment dropped, encoded as a value.
 */
function redactNestedQuery( raw: string ): string {
	const decoded = decodeValue( raw );
	const path = stripUrlCredentials( decoded );
	const cut = path.search( /[?#]/ );

	if ( cut === -1 ) {
		const masked = maskEmails( path );
		return masked === decoded ? raw : encodeMasked( masked );
	}

	const nested = path[ cut ] === '?' ? path.slice( cut + 1 ).split( /[?#]/, 1 )[ 0 ] : '';
	const query = redactQuery( nested );
	const pathname = maskEmails( path.slice( 0, cut ) );

	return encodeMasked( query === '' ? pathname : `${ pathname }?${ query }` );
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

		// A parameter with no value is nothing but its name, and an identifier shape cannot tell a
		// key apart from a bare token appended to the URL, so only a known name survives that way.
		const unnamed = cut === -1 && ! ALLOWED_PARAMS.has( name );

		if ( ! SAFE_NAME.test( name ) || unnamed ) {
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

		if ( NESTED_QUERY_PARAMS.has( name ) ) {
			parts.push( `${ name }=${ redactNestedQuery( raw ) }` );
			continue;
		}

		parts.push(
			`${ name }=${ ALLOWED_PARAMS.has( name ) ? redactAllowedValue( raw ) : REDACTED }`
		);
	}

	return parts.join( '&' );
}
