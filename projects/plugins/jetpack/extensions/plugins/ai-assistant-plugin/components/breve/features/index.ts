/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Features
 */
import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import complexWords, { COMPLEX_WORDS, dictionary as dicComplex } from './complex-words';
import grammar, { GRAMMAR } from './grammar';
import longSentences, { LONG_SENTENCES } from './long-sentences';
import spellingMistakes, { SPELLING_MISTAKES } from './spelling-mistakes';
import unconfidentWords, { UNCONFIDENT_WORDS } from './unconfident-words';
/**
 * Types
 */
import type { BreveFeature } from '../types';

export const isHarperEnabled = getFeatureAvailability( 'ai-proofread-harper' );

// Breve Highlights Features
const features: Array< BreveFeature > = [
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

if ( isHarperEnabled ) {
	features.unshift( {
		config: GRAMMAR,
		highlight: grammar,
		description: __( 'Fix grammar mistakes.', 'jetpack' ),
	} );
} else {
	features.unshift( {
		config: SPELLING_MISTAKES,
		highlight: spellingMistakes,
		description: __( 'Fix spelling mistakes.', 'jetpack' ),
	} );
}

export default features;
