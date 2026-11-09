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
 * Keeps the value of allowlisted query parameters and redacts every other value.
 *
 * @param search - A `location.search` value, with or without the leading `?`.
 * @return Parameter names mapped to their value or `[redacted]`.
 */
export function redactQuery( search: string ): Record< string, string > {
	const redacted: Record< string, string > = Object.create( null );

	for ( const [ name, value ] of new URLSearchParams( search ) ) {
		const key = SAFE_NAME.test( name ) ? name : UNREPORTABLE;
		if ( ! Object.hasOwn( redacted, key ) ) {
			redacted[ key ] = ALLOWED_PARAMS.has( name ) ? value : REDACTED;
		}
	}

	return redacted;
}
