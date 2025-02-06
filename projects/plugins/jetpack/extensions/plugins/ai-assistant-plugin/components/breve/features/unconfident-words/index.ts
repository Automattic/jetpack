/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { escapeRegExp } from '../../utils/escape-regexp';
import getFeatureData from '../../utils/get-feature-data';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const UNCONFIDENT_WORDS: BreveFeatureConfig = {
	name: 'unconfident-words',
	title: __( 'Unconfident words', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--unconfident-words',
	defaultEnabled: true,
};

export default function unconfidentWords( blockText: string ): Array< HighlightedText > {
	const highlightedTexts: Array< HighlightedText > = [];
	const dictionary = getFeatureData( { feature: UNCONFIDENT_WORDS.name, language: 'en' } ) ?? [];
	const list = new RegExp( `\\b(${ dictionary.map( escapeRegExp ).join( '|' ) })\\b`, 'gi' );
	const matches = blockText.matchAll( list );

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
