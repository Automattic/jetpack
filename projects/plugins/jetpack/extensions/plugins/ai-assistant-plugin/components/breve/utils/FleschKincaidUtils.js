const countWords = text => {
	return text.split( /\s+/ ).filter( word => word.length > 0 ).length;
};

const countSentences = text => {
	return text.split( /[.!?]+/ ).filter( sentence => sentence.length > 0 ).length;
};

const countSyllables = word => {
	word = word.toLowerCase();
	if ( word.length <= 3 ) {
		return 1;
	}
	word = word.replace( /(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '' );
	word = word.replace( /^y/, '' );
	const syllables = word.match( /[aeiouy]{1,2}/g );
	return syllables ? syllables.length : 1;
};

const countTotalSyllables = text => {
	return text.split( /\s+/ ).reduce( ( total, word ) => total + countSyllables( word ), 0 );
};

const fleschKincaidGrade = ( words, sentences, syllables ) => {
	return 0.39 * ( words / sentences ) + 11.8 * ( syllables / words ) - 15.59;
};

const calculateFleschKincaid = text => {
	const words = countWords( text );
	const sentences = countSentences( text );
	const syllables = countTotalSyllables( text );

	const gradeLevel = fleschKincaidGrade( words, sentences, syllables );

	return gradeLevel;
};

export default calculateFleschKincaid;
