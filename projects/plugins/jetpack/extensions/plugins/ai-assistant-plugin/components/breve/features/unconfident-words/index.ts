/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import words from './words';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const UNCONFIDENT_WORDS: BreveFeatureConfig = {
	name: 'unconfident-words',
	title: 'Unconfident words',
	tagName: 'span',
	className: 'has-proofread-highlight--unconfident-words',
	defaultEnabled: true,
};

const list = new RegExp( `\\b(${ words.map( escapeRegExp ).join( '|' ) })\\b`, 'gi' );

export default function unconfidentWords( blockText: string ): Array< HighlightedText > {
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
