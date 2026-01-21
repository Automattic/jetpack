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
import { CORE_BLOCKS } from '../../blocks/shared/util/constants.js';

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
	const validFields = childBlocks.filter( childBlock => {
		const settings = childBlock.settings as typeof childBlock.settings & {
			parent?: string | string[];
		};

		return (
			! settings.parent ||
			settings.parent === 'jetpack/contact-form' ||
			( Array.isArray( settings.parent ) && settings.parent.includes( 'jetpack/contact-form' ) )
		);
	} );

	return [ ...validFields.map( block => `jetpack/${ block.name }` ) ].concat( CORE_BLOCKS );
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

	// Find blocks that need to be hidden (not in allowed list)
	const blocksToHide = allBlockTypes
		.map( block => block.name )
		.filter( blockName => ! allowedBlocks.has( blockName ) );

	// Verify the change
	const { getPreference } = select( 'core/edit-post' ) as {
		getPreference: ( preference: string ) => unknown;
	};
	// Store for later restoration
	hiddenBlockTypes = getPreference( 'hiddenBlockTypes' ) as string[];
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
