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
 * @param text               - The text to check the grammar of.
 * @param blockId            - The block id.
 * @param richTextIdentifier - The rich text identifier of the block.
 * @return array An empty array.
 */
export default function grammar(
	text: string,
	blockId: string,
	richTextIdentifier: string
): Array< HighlightedText > {
	getLintsFromHarper( text, blockId, richTextIdentifier );

	return getHighlightsFromStore( text, blockId, richTextIdentifier );
}

/**
 * Harper wrapper to get the lints asynchronously and save them to the store
 * @param text               - The text to check the grammar of.
 * @param blockId            - The block id.
 * @param richTextIdentifier - The rich text identifier of the block.
 */
async function getLintsFromHarper( text: string, blockId: string, richTextIdentifier: string ) {
	const { setLints } = dispatch( 'jetpack/ai-breve' ) as BreveDispatch;
	const previousLints = ( select( 'jetpack/ai-breve' ) as BreveSelect ).getLints(
		blockId,
		GRAMMAR.name,
		text
	);

	// We already have lints for this text, so we don't need to run the linter again
	if ( Array.isArray( previousLints ) ) {
		return;
	}

	const lints = await worker.lint( text );

	const items = [];

	for ( const lint of lints ) {
		const item = {
			message: lint.message(),
			startIndex: lint.span().start,
			endIndex: lint.span().end,
			kind: lint.lint_kind(),
		};
		items.push( item );
	}

	setLints( { text, lints: items, feature: GRAMMAR.name, blockId, richTextIdentifier } );
}

/**
 * Gets the highlights from the store
 * @param text               - The text to check the grammar of.
 * @param blockId            - The block id.
 * @param richTextIdentifier - The rich text identifier of the block.
 * @return array A list of highlights.
 */
export function getHighlightsFromStore(
	text: string,
	blockId: string,
	richTextIdentifier: string
) {
	// If the richTextIdentifier is 'content', the text is replaced inline on the store, so we return whichever text is there immediately to avoid flickering
	if ( richTextIdentifier === 'content' ) {
		const texts = ( select( 'jetpack/ai-breve' ) as BreveSelect ).getLintFeatureTexts(
			blockId,
			GRAMMAR.name
		);

		// There is at most one text for this block/feature, so we can return whichever one it is, if any
		const keys = Object.keys( texts );

		if ( keys.length === 0 ) {
			return [];
		}

		return texts[ keys[ 0 ] ];
	}

	const lints = ( select( 'jetpack/ai-breve' ) as BreveSelect ).getLints(
		blockId,
		GRAMMAR.name,
		text
	);

	return lints;
}
