/**
 * This is a copy of the client/lib/formatting/decode-entities/browser.js file from
 * Calypso. If Jetpack uses Calypso as a dependency one day, this can be removed and
 * included straight from the source.
 * @see https://github.com/Automattic/wp-calypso/blob/master/client/lib/formatting/decode-entities/browser.js
 */

let element = ( () => {
	if ( document.implementation && document.implementation.createHTMLDocument ) {
		return document.implementation.createHTMLDocument( '' ).createElement( 'textarea' );
	}

	return document.createElement( 'textarea' );
} )();

export default function decodeEntities( text ) {
	if ( text === undefined || text === false || text === null ) {
		return text;
	}

	element.innerHTML = text;
	let decoded = element.textContent;
	element.innerHTML = '';
	return decoded;
};
