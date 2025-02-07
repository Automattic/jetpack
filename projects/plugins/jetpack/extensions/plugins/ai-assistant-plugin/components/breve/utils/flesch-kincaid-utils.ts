const countWords = ( text: string ) => {
	return text.split( /\s+/ ).filter( word => word.length > 0 ).length;
};

const countSentences = ( text: string ) => {
	return text.split( /[.!?]+/ ).filter( sentence => sentence.length > 0 ).length;
};

const countSyllables = ( word: string ) => {
	if ( word.length <= 3 ) {
		return 1;
	}

	word = word
		.toLowerCase()
		.replace( /(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '' )
		.replace( /^y/, '' );

	const syllables = word.match( /[aeiouy]{1,2}/g );

	return syllables ? syllables.length : 1;
};

const countTotalSyllables = ( text: string ) => {
	return text.split( /\s+/ ).reduce( ( total, word ) => total + countSyllables( word ), 0 );
};

const fleschKincaidGrade = ( words: number, sentences: number, syllables: number ) => {
	if ( words === 0 || sentences === 0 ) {
		return null;
	}

	return 0.39 * ( words / sentences ) + 11.8 * ( syllables / words ) - 15.59;
};

const calculateFleschKincaid = ( text: string ) => {
	const words = countWords( text );
	const sentences = countSentences( text );
	const syllables = countTotalSyllables( text );
	const gradeLevel = fleschKincaidGrade( words, sentences, syllables );

	return gradeLevel;
};

export default calculateFleschKincaid;
