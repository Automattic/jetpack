/**
 * Decodes HTML entities using DOMParser if available
 *
 * @since 5.8.0
 *
 * @param  {String} text The text to decode
 * @return {String}      Returns the string with HTML entities decoded if DOMParser is available. Returns the original text otherwise.
 */
export default function decodeEntities( text ) {
	if ( 'undefined' === typeof DOMParser ) {
		return text;
	}

	const document = new DOMParser().parseFromString( text, 'text/html' );
	return document.documentElement.textContent;
}
