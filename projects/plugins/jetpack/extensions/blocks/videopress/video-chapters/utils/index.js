const elementInstance = ( () => {
	if ( document.implementation?.createHTMLDocument ) {
		return document.implementation.createHTMLDocument( '' ).createElement( 'textarea' );
	}

	return document.createElement( 'textarea' );
} )();

export function decodeEntities( text ) {
	elementInstance.innerHTML = text;
	const decoded = elementInstance.textContent;
	elementInstance.innerHTML = '';
	return decoded;
}
