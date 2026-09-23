export const URL_REGEX = /^(?:(?:https?:)?\/\/)?scheduler\.zoom\.us\/.+/i;

const IFRAME_REGEX = /<iframe/i;
const FULL_PROTOCOL_REGEX = /^[a-z][a-z\d+.-]*:\/\//i;
const PROTOCOL_RELATIVE_REGEX = /^\/\//;

/**
 * Normalize user input into a Zoom Scheduler booking page URL.
 *
 * @param {string} input - User-provided scheduler URL.
 * @return {string|undefined} Normalized URL or undefined when invalid.
 */
export function normalizeUrl( input ) {
	if ( ! input ) {
		return undefined;
	}

	const trimmedInput = input.trim();
	if ( IFRAME_REGEX.test( trimmedInput ) || ! URL_REGEX.test( trimmedInput ) ) {
		return undefined;
	}

	const urlString = FULL_PROTOCOL_REGEX.test( trimmedInput )
		? trimmedInput
		: `https://${ trimmedInput.replace( PROTOCOL_RELATIVE_REGEX, '' ) }`;

	try {
		const url = new URL( urlString );
		if ( 'scheduler.zoom.us' !== url.hostname || '/' === url.pathname ) {
			return undefined;
		}
		if ( 'https:' !== url.protocol ) {
			url.protocol = 'https:';
		}

		return `${ url.origin }${ url.pathname }${ url.search }`;
	} catch {
		return undefined;
	}
}

/**
 * Return the Zoom Scheduler embed URL for previews and rendering.
 *
 * @param {string} input - User-provided scheduler URL.
 * @return {string|undefined} Embed URL or undefined when invalid.
 */
export function getEmbedUrl( input ) {
	const normalizedUrl = normalizeUrl( input );
	if ( ! normalizedUrl ) {
		return undefined;
	}

	const url = new URL( normalizedUrl );
	url.searchParams.set( 'embed', 'true' );

	return url.toString();
}
