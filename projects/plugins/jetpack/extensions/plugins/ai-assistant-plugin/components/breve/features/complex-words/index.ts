/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escapeRegExp';
import phrases from './phrases';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const dictionary = phrases;

export const COMPLEX_WORDS: BreveFeatureConfig = {
	name: 'complex-words',
	title: __( 'Complex words', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--complex-words',
	defaultEnabled: true,
};

const list = new RegExp(
	`\\b(${ Object.keys( phrases ).map( escapeRegExp ).join( '|' ) })\\b`,
	'gi'
);

export default function complexWords( blockText: string ): Array< HighlightedText > {
	const matches = blockText.matchAll( list );
	const highlightedTexts: Array< HighlightedText > = [];

	for ( const match of matches ) {
		const text = match[ 0 ].trim();
		highlightedTexts.push( {
			text,
			suggestion: phrases[ text ],
			startIndex: match.index,
			endIndex: match.index + text.length,
		} );
	}

	return highlightedTexts;
}
