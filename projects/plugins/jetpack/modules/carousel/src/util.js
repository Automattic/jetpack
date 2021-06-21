export function noop() {}

export function unique( array ) {
	const newArray = [];
	array.forEach( function ( item ) {
		if ( item !== undefined && newArray.indexOf( item ) === -1 ) {
			newArray.push( item );
		}
	} );

	return newArray;
}

export function texturize( text ) {
	// Ensure we get a string.
	text = text + '';
	text = text
		.replace( /'/g, '&#8217;' )
		.replace( /&#039;/g, '&#8217;' )
		.replace( /[\u2019]/g, '&#8217;' );
	text = text
		.replace( /"/g, '&#8221;' )
		.replace( /&#034;/g, '&#8221;' )
		.replace( /&quot;/g, '&#8221;' )
		.replace( /[\u201D]/g, '&#8221;' );
	// Untexturize allowed HTML tags params double-quotes.
	text = text.replace( /([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"' );
	return text.trim();
}

export function applyReplacements( text, replacements ) {
	if ( ! text ) {
		return;
	}
	if ( ! replacements ) {
		return text;
	}
	return text.replace( /{(\d+)}/g, function ( match, number ) {
		return typeof replacements[ number ] !== 'undefined' ? replacements[ number ] : match;
	} );
}
