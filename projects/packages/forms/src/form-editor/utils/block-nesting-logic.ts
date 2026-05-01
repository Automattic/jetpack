/**
 * Block nesting logic utilities
 *
 * Pure functions for determining how to handle blocks that need to be moved
 * into the form. These functions contain the decision logic for:
 * - When to dedupe empty paragraphs
 * - When to add a submit button (empty/placeholder form state)
 * - Where to insert blocks in the form
 *
 * @package
 */

import { getInsertionIndex, isEmptyParagraph } from './block-utils';
import type { Block } from '@wordpress/blocks';

export interface BlockNestingAction {
	/**
	 * The action to take when moving blocks into the form
	 */
	type: 'move-blocks' | 'dedupe-empty-paragraph';
	/**
	 * The index where blocks should be inserted (for move-blocks action)
	 */
	insertionIndex?: number;
	/**
	 * Whether the target block was empty before insertion (for move-blocks action)
	 */
	targetWasEmpty?: boolean;
	/**
	 * The clientId of the existing empty paragraph to select (for dedupe-empty-paragraph action)
	 */
	existingEmptyParagraphId?: string;
}

/**
 * Determines what action to take when moving blocks into the form.
 *
 * This function encapsulates the decision logic for:
 * 1. Detecting when to dedupe empty paragraphs (when moving a single empty paragraph and the form already has an empty paragraph at the end)
 * 2. Detecting when to add a submit button (when the form was empty/placeholder state)
 * 3. Calculating the correct insertion index (before the submit button if one exists)
 *
 * @param targetBlock  - The block that will receive the moved blocks (form block or step block)
 * @param blocksToMove - The blocks that need to be moved into the target
 * @return Action object describing what to do
 */
export function determineBlockNestingAction(
	targetBlock: Block,
	blocksToMove: Block[]
): BlockNestingAction {
	const wasEmpty = targetBlock.innerBlocks.length === 0;

	// Check for dedupe-empty-paragraph case:
	// If the only block to move is an empty paragraph and the target already has an empty
	// paragraph at the end (before the submit button), just select the existing one
	if ( ! wasEmpty && blocksToMove.length === 1 && isEmptyParagraph( blocksToMove[ 0 ] ) ) {
		// Find the last non-button block in the target
		const lastNonButtonBlock = [ ...targetBlock.innerBlocks ]
			.reverse()
			.find( b => b.name !== 'jetpack/button' && b.name !== 'core/button' );

		if ( lastNonButtonBlock && isEmptyParagraph( lastNonButtonBlock ) ) {
			return {
				type: 'dedupe-empty-paragraph',
				existingEmptyParagraphId: lastNonButtonBlock.clientId,
			};
		}
	}

	// Move blocks case
	if ( wasEmpty ) {
		// Form was empty (placeholder state)
		return {
			type: 'move-blocks',
			insertionIndex: 0,
			targetWasEmpty: true,
		};
	}

	// Form already has blocks, insert new blocks at the target index (before submit button if exists)
	return {
		type: 'move-blocks',
		insertionIndex: getInsertionIndex( targetBlock ),
		targetWasEmpty: false,
	};
}
