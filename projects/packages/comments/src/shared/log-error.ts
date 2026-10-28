/**
 * Send a failure's details to WordPress.com's logstash, where the site allows usage events.
 *
 * @param error      - What was thrown.
 * @param properties - Where it happened. Nothing the reader typed.
 */
export const logError = (
	error: unknown,
	properties: Record< string, string | number | boolean > = {}
) => {
	const { tracks, identity, version } = JetpackComments;

	if ( ! tracks ) {
		return;
	}

	const { name, message, stack, type, request } = ( error ?? {} ) as Partial<
		Error & { type: string; request: string }
	>;

	window
		.fetch( 'https://public-api.wordpress.com/rest/v1.1/js-error', {
			method: 'POST',
			// Form-encoded, so the cross-origin post skips a preflight.
			body: new URLSearchParams( {
				error: JSON.stringify( {
					feature: 'jetpack_comments',
					// The endpoint drops a row without a message, and an object would read `[object Object]`.
					message:
						message ||
						( error && typeof error === 'object' ? 'Non-error thrown' : String( error ) ),
					trace: stack,
					url: location.origin + location.pathname,
					blog_id: identity.blogId,
					properties: {
						platform: tracks.platform,
						version,
						name,
						type,
						request,
						// `false` proves a dropped connection, `true` only means some network was up.
						online: navigator.onLine,
						...properties,
					},
				} ),
			} ),
			keepalive: true,
		} )
		.catch( () => {} );
};
