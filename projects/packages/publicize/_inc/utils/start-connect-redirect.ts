/**
 * Generate an unguessable request id correlating a connect attempt with its stored result.
 *
 * @return The request id.
 */
export function generateRequestId(): string {
	return globalThis.crypto?.randomUUID?.() ?? Math.random().toString( 36 ).slice( 2, 14 );
}

/**
 * Navigate the current tab to the wpcom connect URL to start the OAuth redirect.
 *
 * No postFields → GET via location.replace. With postFields (Bluesky/Mastodon inputs) → a
 * navigational POST so credentials stay in the body, never a URL. Must be a real navigation (not
 * fetch) so the browser follows wpcom's redirect back to return_url.
 *
 * @param connectUrl - Fully-built connect URL (auth_flow=v2, request_id, return_url, …).
 * @param postFields - Optional POST body fields (credentials / instance).
 */
export function startConnectRedirect(
	connectUrl: string,
	postFields?: Record< string, string >
): void {
	if ( ! postFields || Object.keys( postFields ).length === 0 ) {
		window.location.replace( connectUrl );
		return;
	}

	const form = document.createElement( 'form' );
	form.method = 'post';
	form.action = connectUrl;
	form.style.display = 'none';

	for ( const [ name, value ] of Object.entries( postFields ) ) {
		const input = document.createElement( 'input' );
		input.type = 'hidden';
		input.name = name;
		input.value = value;
		form.appendChild( input );
	}

	document.body.appendChild( form );
	form.submit();
}
