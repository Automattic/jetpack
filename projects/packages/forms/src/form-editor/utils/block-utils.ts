/**
 * Block utility functions
 *
 * Pure functions for block manipulation with no side effects.
 * These functions handle logic for finding, positioning, and validating blocks.
 *
 * @package
 */

import type { Block } from '@wordpress/blocks';

export interface BlockLock {
	remove?: boolean;
	move?: boolean;
}

/**
 * Finds the first jetpack/contact-form block in an array of blocks.
 *
 * @param blocks - Array of blocks to search
 * @return The form block or null if not found
 */
export function findFormBlock( blocks: Block[] ): Block | null {
	return blocks.find( block => block.name === 'jetpack/contact-form' ) || null;
}

/**
 * Determines the insertion index for blocks being moved into the form.
 *
 * Blocks should be inserted before the button block (if one exists) to ensure
 * the submit button stays at the bottom of the form.
 *
 * @param formBlock - The form block to insert into
 * @return The index where new blocks should be inserted
 */
export function getInsertionIndex( formBlock: Block ): number {
	const buttonBlockIndex = formBlock.innerBlocks.findIndex(
		block => block.name === 'jetpack/button' || block.name === 'core/button'
	);

	if ( buttonBlockIndex > -1 ) {
		return buttonBlockIndex;
	}

	return formBlock.innerBlocks.length;
}

/**
 * Checks if a block should be locked (prevent removal and moving).
 *
 * A block should be locked if it doesn't already have both remove and move locks applied.
 * Returns true if either lock is missing, false if both locks are already set.
 *
 * @param block - The block to check
 * @return True if the block should be locked
 */
export function shouldLockBlock( block: Block ): boolean {
	const lock = block.attributes?.lock as BlockLock | undefined;
	return ! lock?.remove || ! lock?.move;
}

/**
 * Filters out the form block from a list of blocks.
 *
 * This is used to find blocks that need to be moved into the form block
 * (blocks that are at the root level but shouldn't be).
 *
 * @param blocks            - Array of blocks
 * @param formBlockClientId - Client ID of the form block to exclude
 * @return Array of blocks without the form block
 */
export function getBlocksToMove( blocks: Block[], formBlockClientId: string ): Block[] {
	return blocks.filter( block => block.clientId !== formBlockClientId );
}
