function extractHexCode( input ) {
	let output;
	if ( input[ 0 ] === '#' ) {
		output = input.substring( 1 );
	}
	if ( output.length === 3 ) {
		output = output
			.split( '' )
			.map( letter => `${ letter }${ letter }` )
			.join( '' );
	}
	return output;
}

export function getConstrastingColor( input ) {
	// https://gomakethings.com/dynamically-changing-the-text-color-based-on-background-color-contrast-with-vanilla-js/
	const colorHex = extractHexCode( input );
	const r = parseInt( colorHex.substr( 0, 2 ), 16 );
	const g = parseInt( colorHex.substr( 2, 2 ), 16 );
	const b = parseInt( colorHex.substr( 4, 2 ), 16 );
	const yiq = ( r * 299 + g * 587 + b * 114 ) / 1000;
	return yiq >= 128 ? 'black' : 'white';
}
