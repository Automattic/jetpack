/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const LONG_SENTENCES: BreveFeatureConfig = {
	name: 'long-sentences',
	title: 'Long sentences',
	tagName: 'span',
	className: 'has-proofread-highlight--long-sentences',
};

const sentenceRegex = /[^\s][^.!?]+[.!?]+/g;

export default function longSentences( text: string ): Array< HighlightedText > {
	const highlightedTexts: Array< HighlightedText > = [];

	const sentenceMatches = text.match( sentenceRegex );

	if ( ! sentenceMatches ) {
		return highlightedTexts;
	}

	const sentences = [
		// Unique sentences with more than 20 words
		...new Set( sentenceMatches.filter( sentence => sentence.split( /\s+/ ).length > 20 ) ),
	];

	sentences.forEach( sentence => {
		const regex = new RegExp( escapeRegExp( sentence ), 'gi' );
		const matches = text.matchAll( regex );

		for ( const match of matches ) {
			highlightedTexts.push( {
				text: sentence,
				startIndex: match.index,
				endIndex: match.index + sentence.length,
			} );
		}
	} );

	return highlightedTexts;
}
