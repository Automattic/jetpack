/**
 * Features
 */
import complexWords, { COMPLEX_WORDS, dictionary as dicComplex } from './complex-words';
import longSentences, { LONG_SENTENCES } from './long-sentences';
import unconfidentWords, { UNCONFIDENT_WORDS } from './unconfident-words';
/**
 * Types
 */
import type { BreveFeature } from '../types';

// Breve Highlights Features
const features: Array< BreveFeature > = [
	{
		config: COMPLEX_WORDS,
		highlight: complexWords,
		dictionary: dicComplex,
	},
	{
		config: LONG_SENTENCES,
		highlight: longSentences,
	},
	{
		config: UNCONFIDENT_WORDS,
		highlight: unconfidentWords,
	},
];

export default features;
