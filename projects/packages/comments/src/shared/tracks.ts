let loading = false;

/**
 * Record a usage event in Tracks, where the site allows it.
 *
 * @param name       - Full event name, e.g. `jetpack_comments_dialog_open`.
 * @param properties - Event properties. Nothing the reader typed.
 */
export const recordEvent = (
	name: string,
	properties: Record< string, string | number | boolean > = {}
) => {
	const { tracks, identity, version } = JetpackComments;

	if ( ! tracks ) {
		return;
	}

	window._tkq = window._tkq || [];
	window._tkq.push( [
		'recordEvent',
		name,
		{ blog_id: identity.blogId, platform: tracks.platform, version, ...properties },
	] );

	// Fetched with the first event, so a reader who never reaches for the form never loads it.
	if ( ! loading ) {
		loading = true;

		if ( ! document.querySelector( 'script[src*="stats.wp.com/w.js"]' ) ) {
			const script = document.createElement( 'script' );
			script.src = 'https://stats.wp.com/w.js';
			script.async = true;
			document.head.appendChild( script );
		}
	}
};
