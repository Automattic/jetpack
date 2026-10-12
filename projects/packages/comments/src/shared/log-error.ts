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
					message: message || String( error ),
					trace: stack,
					url: location.origin + location.pathname,
					blog_id: identity.blogId,
					properties: { platform: tracks.platform, version, name, type, request, ...properties },
				} ),
			} ),
			keepalive: true,
		} )
		.catch( () => {} );
};
