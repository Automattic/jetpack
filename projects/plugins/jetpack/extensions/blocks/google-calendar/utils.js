const url_regex_string = 's*https?://calendar.google.com/calendar';
export const URL_REGEX = new RegExp( `^${ url_regex_string }`, 'i' );
export const IFRAME_REGEX = new RegExp(
	`<iframe((?:\\s+\\w+=(['"]).*?\\2)*)\\s+src=(["'])(${ url_regex_string }.*?)\\3((?:\\s+\\w+=(['"]).*?\\6)*)`,
	'i'
);
export const SHAREABLE_REGEX = new RegExp(
	`${ url_regex_string }\\?cid=([-A-Za-z0-9+/]+={0,3})`,
	'i'
);

const ATTRIBUTE_REGEX = /\s+(\w+)=(["'])(.*?)\2/gi;

/**
 * Converts a Google Calendar shareable URL of the format:
 * https://calendar.google.com/calendar?cid=Z2xlbi5kYXZpZXNAYThjLmNvbQ
 *
 * to an embed URL.
 *
 * @param   {string} shareableUrl - The Google Calendar shareable URL
 * @returns {string} The embed URL or undefined if the conversion fails
 */
export function convertShareableUrl( shareableUrl ) {
	const parsedUrl = SHAREABLE_REGEX.exec( shareableUrl );
	if ( ! parsedUrl ) {
		return;
	}
	return (
		'https://calendar.google.com/calendar/embed?src=' + encodeURIComponent( atob( parsedUrl[ 1 ] ) )
	);
}

/**
 * Given an <iframe> that matches IFRAME_REGEX, extract the url, width, and height.
 *
 * @param   {string} html - The HTML to extract from.
 * @returns {Object} An object containing the url, width, and height.
 */
export function extractAttributesFromIframe( html ) {
	const data = IFRAME_REGEX.exec( html );

	if ( ! data ) {
		return;
	}

	const attributes = {};

	data.forEach( ( match, index ) => {
		if ( 0 === index ) {
			return;
		}

		if ( URL_REGEX.test( match ) ) {
			attributes.url = match;
			return;
		}

		let attr_match;
		while ( ( attr_match = ATTRIBUTE_REGEX.exec( match ) ) !== null ) {
			attributes[ attr_match[ 1 ] ] = attr_match[ 3 ];
		}
	} );

	return {
		url: attributes.url,
		width: attributes.width,
		height: attributes.height,
	};
}

/**
 * Parses user submitted embed string into an object containing a url and
 * potentially width and height data if the embed code is an iframe.
 *
 * @param   {string} embedString - Embed string to parse.
 * @returns {Object} An object containing URL data.
 */
export function parseEmbed( embedString ) {
	if ( IFRAME_REGEX.test( embedString ) ) {
		return extractAttributesFromIframe( embedString );
	}

	if ( SHAREABLE_REGEX.test( embedString ) ) {
		return { url: convertShareableUrl( embedString ) };
	}

	return { url: embedString };
}
