/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedWord } from '../../types';

export const LONG_SENTENCES: BreveFeatureConfig = {
	name: 'long-sentences',
	title: 'Long sentences',
	tagName: 'span',
	className: 'has-proofread-highlight--long-sentences',
};

const sentenceRegex = /[^\s][^.!?]+[.!?]+/g;

export default function longSentences( text: string ): Array< HighlightedWord > {
	const highlightedWords: Array< HighlightedWord > = [];

	const sentences = [
		// Unique sentences with more than 20 words
		...new Set(
			( text.match( sentenceRegex ) || [] ).filter(
				sentence => sentence.split( /\s+/ ).length > 20
			)
		),
	];

	sentences.forEach( sentence => {
		const regex = new RegExp( escapeRegExp( sentence ), 'gi' );
		const matches = text.matchAll( regex );

		for ( const match of matches ) {
			highlightedWords.push( {
				word: sentence,
				startIndex: match.index,
				endIndex: match.index + sentence.length,
			} );
		}
	} );

	return highlightedWords;
}
