/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Features
 */
import complexWords, { COMPLEX_WORDS, dictionary as dicComplex } from './complex-words';
import longSentences, { LONG_SENTENCES } from './long-sentences';
import spellingMistakes, { SPELLING_MISTAKES } from './spelling-mistakes';
import unconfidentWords, { UNCONFIDENT_WORDS } from './unconfident-words';
/**
 * Types
 */
import type { BreveFeature } from '../types';

// Breve Highlights Features
const features: Array< BreveFeature > = [
	{
		config: SPELLING_MISTAKES,
		highlight: spellingMistakes,
		description: __( 'Fix spelling mistakes.', 'jetpack' ),
	},
	{
		config: COMPLEX_WORDS,
		highlight: complexWords,
		dictionary: dicComplex,
		description: __( 'Use simple, direct words.', 'jetpack' ),
	},
	{
		config: LONG_SENTENCES,
		highlight: longSentences,
		description: __( 'Long sentences are hard to read.', 'jetpack' ),
	},
	{
		config: UNCONFIDENT_WORDS,
		highlight: unconfidentWords,
		description: __( 'Remove weasel words.', 'jetpack' ),
	},
];

export default features;
