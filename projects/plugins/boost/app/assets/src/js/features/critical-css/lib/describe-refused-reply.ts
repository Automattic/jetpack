import { DataSyncError } from '@automattic/jetpack-react-data-sync-client';
import { __, sprintf } from '@wordpress/i18n';

/**
 * The start of the text in a reply body, with any HTML markup removed.
 *
 * @param body - The reply body.
 */
function textStart( body: string ): string {
	// A reply made of unclosed tags makes the patterns below slow, so bound the body first.
	const text = body
		.slice( 0, 4096 )
		.replace( /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ' )
		.replace( /<[^>]+>/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();

	return text.length > 120 ? text.slice( 0, 117 ) + '...' : text;
}

/**
 * Describe a data-sync reply the site refused, naming the HTTP status and the start of the body,
 * so the dashboard can show what answered instead of Boost.
 *
 * @param error - The error a data-sync request rejected with.
 * @return The description, or null when the error is not a refused reply.
 */
export async function describeRefusedReply( error: unknown ): Promise< string | null > {
	if ( ! ( error instanceof DataSyncError ) ) {
		return null;
	}

	const { status, data } = error.errorData;

	if ( status === 'response_not_ok' ) {
		const response = data as Response;
		const line = await response
			.clone()
			.text()
			.then( textStart, () => '' );
		const code = `${ response.status }${ response.statusText ? ' ' + response.statusText : '' }`;

		return line
			? sprintf(
					/* translators: %1$s is an HTTP status such as "502 Bad Gateway"; %2$s is the start of the reply text. */
					__( 'The site answered with HTTP %1$s: %2$s', 'jetpack-boost' ),
					code,
					line
				)
			: sprintf(
					/* translators: %s is an HTTP status such as "502 Bad Gateway". */
					__( 'The site answered with HTTP %s.', 'jetpack-boost' ),
					code
				);
	}

	if ( status === 'json_parse_error' ) {
		// Only a 2xx reply reaches the parser, and these endpoints answer 200.
		const line = textStart( String( data ?? '' ) );
		return line
			? sprintf(
					/* translators: %s is the start of the reply text. */
					__(
						'The site answered HTTP 200 with a page instead of a reply from Boost: %s',
						'jetpack-boost'
					),
					line
				)
			: __(
					'The site answered HTTP 200 with a page instead of a reply from Boost.',
					'jetpack-boost'
				);
	}

	if ( status === 'failed_to_sync' ) {
		return sprintf(
			/* translators: %s is the browser's error message. */
			__( 'The site could not be reached: %s', 'jetpack-boost' ),
			error.message
		);
	}

	return null;
}
