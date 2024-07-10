/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import phrases from './phrases';
/**
 * Types
 */
import type { BreveFeatureConfig, Word } from '../../types';

export const COMPLEX_WORDS: BreveFeatureConfig = {
	name: 'complex-words',
	title: 'Complex words',
	tagName: 'span',
	className: 'has-proofread-highlight',
};

export default function complexWords( text: string ): Array< Word > {
	const list = new RegExp(
		`\\b(${ Object.keys( phrases ).map( escapeRegExp ).join( '|' ) })\\b`,
		'gi'
	);

	const matches = text.matchAll( list );
	const words: Array< Word > = [];

	for ( const match of matches ) {
		const word = match[ 0 ].trim();
		words.push( {
			word,
			suggestion: phrases[ word ],
			startIndex: match.index,
			endIndex: match.index + word.length,
		} );
	}

	return words;
}
