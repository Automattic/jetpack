const elementInstance = ( () => {
	if ( document.implementation?.createHTMLDocument ) {
		return document.implementation.createHTMLDocument( '' ).createElement( 'textarea' );
	}

	return document.createElement( 'textarea' );
} )();

/**
 * Decode entities helper function
 *
 * @param {string} text - text to decode
 * @returns {string} decoed text
 */
export function decodeEntities( text ) {
	elementInstance.innerHTML = text;
	const decoded = elementInstance.textContent;
	elementInstance.innerHTML = '';
	return decoded;
}
