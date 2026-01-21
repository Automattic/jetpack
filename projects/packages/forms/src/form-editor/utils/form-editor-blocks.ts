/**
 * Form editor block filtering utilities
 *
 * Functions to filter the block inserter when entering the form editor
 * using the `hideBlockTypes` and `showBlockTypes` actions from `core/edit-post`.
 *
 * @package
 */

import { getBlockTypes } from '@wordpress/blocks';
import { select, dispatch } from '@wordpress/data';
import { childBlocks } from '../../blocks/contact-form/child-blocks.js';
import { CORE_BLOCKS, FORM_BLOCK_NAME } from '../../blocks/shared/util/constants.js';
import { getValidFormFieldBlocks, getBlocksToHide, type ChildBlock } from './block-filter-utils';

// Re-export pure functions for testing
export { getValidFormFieldBlocks, getBlocksToHide } from './block-filter-utils';

/**
 * Storage for hidden block names to restore them later.
 */
let hiddenBlockTypes: string[] = [];
let shownBlockTypes: string[] = [];

/**
 * Get the list of allowed blocks for the form editor.
 *
 * @return Array of allowed block names
 */
function getAllowedFormEditorBlocks(): string[] {
	const validFields = getValidFormFieldBlocks( childBlocks as ChildBlock[], FORM_BLOCK_NAME );
	return validFields.concat( CORE_BLOCKS );
}

/**
 * Filters the block inserter to only show allowed blocks for the form editor.
 *
 * Uses `hideBlockTypes` action from `core/edit-post` store to hide
 * blocks that are not allowed in the form editor.
 */
export function filterFormEditorBlocks(): void {
	const allowedBlocks = new Set( getAllowedFormEditorBlocks() );
	const allBlockTypes = getBlockTypes();
	const allBlockNames = allBlockTypes.map( block => block.name );

	// Find blocks that need to be hidden (not in allowed list)
	const blocksToHide = getBlocksToHide( allBlockNames, allowedBlocks );

	// Store the current hidden blocks preference for later restoration
	const { getPreference } = select( 'core/edit-post' ) as {
		getPreference: ( preference: string ) => unknown;
	};
	hiddenBlockTypes = ( getPreference( 'hiddenBlockTypes' ) as string[] ) || [];
	shownBlockTypes = blocksToHide;

	const { hideBlockTypes } = dispatch( 'core/edit-post' ) as {
		hideBlockTypes: ( blockNames: string[] ) => void;
	};

	hideBlockTypes( blocksToHide );
}

/**
 * Restores the block inserter to show all previously hidden blocks.
 *
 * Uses `showBlockTypes` action from `core/edit-post` store.
 */
export function restoreAllBlocks(): void {
	if ( shownBlockTypes.length === 0 ) {
		return;
	}

	const { showBlockTypes, hideBlockTypes } = dispatch( 'core/edit-post' ) as {
		showBlockTypes: ( blockNames: string[] ) => void;
		hideBlockTypes: ( blockNames: string[] ) => void;
	};

	showBlockTypes( shownBlockTypes );
	hideBlockTypes( hiddenBlockTypes );

	// Clear the stored list
	hiddenBlockTypes = [];
	shownBlockTypes = [];
}
