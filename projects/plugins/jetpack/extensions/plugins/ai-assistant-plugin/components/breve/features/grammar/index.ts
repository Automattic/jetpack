/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { WorkerLinter } from 'harper.js';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText, BreveDispatch } from '../../types';

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

	const grammarData = select( 'jetpack/ai-breve' ).getLints();

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

// init Harper's linter
const worker = new WorkerLinter();

/**
 * This is a very small Harper wraper
 * @param text - The text to check the grammar of.
 * @return array A list of suggestions.
 */
async function CheckGrammar( text: string ) {
	const { setDictionaryLoading, setLints } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	setDictionaryLoading( GRAMMAR, true );

	const lints = await worker.lint( text );

	const items = [];

	for ( const lint of lints ) {
		items.push( {
			text,
			message: lint.message(),
			startIndex: lint.span().start,
			endIndex: lint.span().end,
			suggestions: lint.suggestions(),
			numSuggestions: lint.suggestion_count(),
		} );
	}

	setLints( { lints: items, feature: GRAMMAR } );

	setDictionaryLoading( GRAMMAR, false );
}
