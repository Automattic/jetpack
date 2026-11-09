const REDACTED = '[redacted]';

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
	const redacted: Record< string, string > = {};

	for ( const [ name, value ] of new URLSearchParams( search ) ) {
		if ( ! Object.hasOwn( redacted, name ) ) {
			redacted[ name ] = ALLOWED_PARAMS.has( name ) ? value : REDACTED;
		}
	}

	return redacted;
}
