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

/**
 * Finds the step container block inside a form block, searching recursively
 * through nested inner blocks.
 *
 * @param formBlock - The form block to search
 * @return The step container block or null if not found
 */
export function findStepContainer( formBlock: Block ): Block | null {
	for ( const block of formBlock.innerBlocks ) {
		if ( block.name === 'jetpack/form-step-container' ) {
			return block;
		}
		const found = findStepContainer( block );
		if ( found ) {
			return found;
		}
	}
	return null;
}

/**
 * Finds the active step block inside a step container.
 *
 * Looks for the step matching activeStepId within the container's inner blocks.
 * Falls back to the first step if no matching step is found.
 *
 * @param stepContainer - The step container block
 * @param activeStepId  - The client ID of the active step (from the store)
 * @return The active step block, the first step as fallback, or null if no steps exist
 */
export function findActiveStepInContainer(
	stepContainer: Block,
	activeStepId: string | null
): Block | null {
	if ( stepContainer.innerBlocks.length === 0 ) {
		return null;
	}

	if ( activeStepId ) {
		const activeStep = stepContainer.innerBlocks.find( b => b.clientId === activeStepId );
		if ( activeStep ) {
			return activeStep;
		}
	}

	// Fall back to the first step
	return stepContainer.innerBlocks[ 0 ];
}

/**
 * Checks if a block is an empty paragraph.
 *
 * Handles various content types: undefined, null, empty string, empty object {},
 * and RichText value objects with a toString() method.
 *
 * @param block                    - The block to check
 * @param block.name               - The block name
 * @param block.attributes         - The block attributes
 * @param block.attributes.content - The paragraph content
 * @return True if the block is an empty paragraph
 */
export function isEmptyParagraph( block: {
	name: string;
	attributes?: { content?: unknown };
} ): boolean {
	if ( block.name !== 'core/paragraph' ) {
		return false;
	}
	const content = block.attributes?.content;
	// Handle: undefined, null
	if ( content === undefined || content === null ) {
		return true;
	}
	// Handle string content
	if ( typeof content === 'string' ) {
		return content === '';
	}
	// Handle object content (RichText or empty object)
	if ( typeof content === 'object' ) {
		// Check for empty plain object {} first
		if ( Object.keys( content ).length === 0 ) {
			return true;
		}
		// RichText objects have a custom toString() method that returns the text content
		// Check if toString returns something other than the default "[object Object]"
		const textContent = String( content );
		if ( textContent !== '[object Object]' ) {
			return textContent === '';
		}
	}
	return false;
}
