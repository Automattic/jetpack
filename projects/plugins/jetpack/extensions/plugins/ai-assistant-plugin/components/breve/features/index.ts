/**
 * Features
 */
import complexWords, { COMPLEX_WORDS } from './complex-words';
/**
 * Types
 */
import type { BreveFeature } from '../types';

// Breve Highlights Features
const features: Array< BreveFeature > = [
	{
		config: COMPLEX_WORDS,
		highlight: complexWords,
	},
];

export default features;
