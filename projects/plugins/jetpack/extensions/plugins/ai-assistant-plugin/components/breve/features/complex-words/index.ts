/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import phrases from './phrases';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedWord } from '../../types';

export const COMPLEX_WORDS: BreveFeatureConfig = {
	name: 'complex-words',
	title: 'Complex words',
	tagName: 'span',
	className: 'has-proofread-highlight--complex-words',
};

const list = new RegExp(
	`\\b(${ Object.keys( phrases ).map( escapeRegExp ).join( '|' ) })\\b`,
	'gi'
);

export default function complexWords( text: string ): Array< HighlightedWord > {
	const matches = text.matchAll( list );
	const highlightedWords: Array< HighlightedWord > = [];

	for ( const match of matches ) {
		const word = match[ 0 ].trim();
		highlightedWords.push( {
			word,
			suggestion: phrases[ word ],
			startIndex: match.index,
			endIndex: match.index + word.length,
		} );
	}

	return highlightedWords;
}
