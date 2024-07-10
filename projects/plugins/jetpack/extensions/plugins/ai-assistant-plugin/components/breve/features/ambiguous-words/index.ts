/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import weaselWords from './words';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedWord } from '../../types';

export const AMBIGUOUS_WORDS: BreveFeatureConfig = {
	name: 'ambiguous-words',
	title: 'Ambiguous words',
	tagName: 'span',
	className: 'has-proofread-highlight--ambiguous-words',
};

const list = new RegExp( `\\b(${ weaselWords.map( escapeRegExp ).join( '|' ) })\\b`, 'gi' );

export default function ambiguousWords( text: string ): Array< HighlightedWord > {
	const matches = text.matchAll( list );
	const highlightedWords: Array< HighlightedWord > = [];

	for ( const match of matches ) {
		const word = match[ 0 ].trim();
		highlightedWords.push( {
			word,
			startIndex: match.index,
			endIndex: match.index + word.length,
		} );
	}

	return highlightedWords;
}
