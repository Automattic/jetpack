/**
 * External dependencies
 */
import { CheckGrammar } from '@automattic/jetpack-ai-client';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
//import { store as grammerStore } from '../../store';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText } from '../../types';

export const GRAMMAR: BreveFeatureConfig = {
	name: 'grammar',
	title: __( 'Grammar', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--grammar',
	defaultEnabled: true,
};

export default function grammar( text: string ): Array< HighlightedText > {
	const highlightedTexts: Array< HighlightedText > = [];

	CheckGrammar( text );

	const grammarData = JSON.parse(
		localStorage.getItem(
			'grammar-poc-test' // TODO: add post ID
		)
	);

	if ( ! grammarData ) {
		return highlightedTexts;
	}

	for ( const lint of grammarData ) {
		highlightedTexts.push( {
			text: lint.text,
			suggestion: lint.suggestions.length > 0 ? lint.suggestions[ 0 ] : '',
			startIndex: lint.startIndex,
			endIndex: lint.endIndex,
		} );
	}

	return highlightedTexts;
}
