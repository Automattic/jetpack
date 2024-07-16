/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import weaselWords from './words';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const AMBIGUOUS_WORDS: BreveFeatureConfig = {
	name: 'ambiguous-words',
	title: 'Ambiguous words',
	tagName: 'span',
	className: 'has-proofread-highlight--ambiguous-words',
};

const list = new RegExp( `\\b(${ weaselWords.map( escapeRegExp ).join( '|' ) })\\b`, 'gi' );

export default function ambiguousWords( blockText: string ): Array< HighlightedText > {
	const matches = blockText.matchAll( list );
	const highlightedTexts: Array< HighlightedText > = [];

	for ( const match of matches ) {
		const text = match[ 0 ].trim();
		highlightedTexts.push( {
			text,
			startIndex: match.index,
			endIndex: match.index + text.length,
		} );
	}

	return highlightedTexts;
}
