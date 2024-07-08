/**
 * Features
 */
import complexWords, { COMPLEX_WORDS, registerComplexWordsEvents } from './complex-words';

// Breve Highlights Features
export default [
	{
		config: COMPLEX_WORDS,
		highlight: complexWords,
		events: registerComplexWordsEvents,
	},
];
