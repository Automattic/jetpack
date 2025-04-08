/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { WorkerLinter, binary } from 'harper.js';
/**
 * Types
 */
import type { BreveFeatureConfig, HighlightedText, BreveDispatch, BreveSelect } from '../../types';

export const GRAMMAR: BreveFeatureConfig = {
	name: 'grammar-harper',
	title: __( 'Grammar', 'jetpack' ),
	tagName: 'span',
	className: 'jetpack-ai-breve__has-proofread-highlight--grammar-harper',
	defaultEnabled: true,
};

const worker = new WorkerLinter( { binary } );

/**
 * This is the main function that runs on content change. It just starts the async grammar check.
 * @param text    - The text to check the grammar of.
 * @param blockId - The block id.
 * @return array An empty array.
 */
export default function grammar( text: string, blockId: string ): Array< HighlightedText > {
	getLintsFromHarper( text, blockId );

	return getHighlightsFromStore( blockId );
}

/**
 * Harper wrapper to get the lints asynchronously and save them to the store
 * @param text    - The text to check the grammar of.
 * @param blockId - The block id.
 */
async function getLintsFromHarper( text: string, blockId: string ) {
	const { setLints } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;

	const lints = await worker.lint( text );

	const items = [];

	for ( const lint of lints ) {
		const suggestions = lint.suggestions().map( suggestion => {
			return {
				replacement: suggestion.get_replacement_text(),
				kind: suggestion.kind(),
			};
		} );

		const item = {
			text,
			message: lint.message(),
			startIndex: lint.span().start,
			endIndex: lint.span().end,
			suggestions,
			numSuggestions: lint.suggestion_count(),
			kind: lint.lint_kind(),
		};
		items.push( item );
	}

	setLints( { lints: items, feature: GRAMMAR.name, blockId } );
}

/**
 * Gets the highlights from the store
 * @param blockId - The block id.
 * @return array A list of highlights.
 */
export function getHighlightsFromStore( blockId: string ) {
	const lints = ( select( 'jetpack/ai-breve' ) as BreveSelect ).getLintsByFeature(
		blockId,
		GRAMMAR.name
	);

	// Convert lints to HighlightedText format
	return lints.map( lint => ( {
		text: lint.text,
		startIndex: lint.startIndex,
		endIndex: lint.endIndex,
		suggestions: lint.suggestions,
	} ) );
}
