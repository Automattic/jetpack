type PreventWidowsFunction = ( text: string, wordsToKeep?: number ) => string;
type PreventWidowsInPartFunction = (
	text: string,
	spacesToSubstitute: number
) => { part: string; substituted: number };

const reverseSpaceRegex = /\s+(\S*)$/;

const preventWidowsInPart: PreventWidowsInPartFunction = ( part, spacesToSubstitute ) => {
	let substituted = 0;

	if ( part && part.length > 0 ) {
		let text = part;
		let retVal = '';

		// If the part is a string, work from the right looking for spaces
		// TODO Work out if we can tell that this is a RTL language, and if it's appropriate to join words in this way
		while ( substituted < spacesToSubstitute && reverseSpaceRegex.test( text ) ) {
			const match = reverseSpaceRegex.exec( text );
			retVal = '\xA0' + match[ 1 ] + retVal;
			text = text.replace( reverseSpaceRegex, '' );
			substituted++;
		}
		retVal = text + retVal;
		// Return the modified string and the number of spaces substituted
		return { part: retVal, substituted };
	}

	// For anything else e.g. an element without children, there's nothing to do.
	return { part, substituted };
};

const preventWidows: PreventWidowsFunction = ( text, wordsToKeep = 2 ) => {
	return preventWidowsInPart(
		'string' === typeof text ? text.trim() : text,
		Math.max( 1, wordsToKeep - 1 )
	).part;
};

export default preventWidows;
