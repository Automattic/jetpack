/**
 * Block category override utilities
 *
 * Provides functions to dynamically override block categories in the
 * Jetpack Form editor. When activated, blocks with a `formEditorCategory`
 * setting will have their category changed to the corresponding form category.
 *
 * @package
 */

import { select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { getFormCategorySlug } from './form-categories';

const FILTER_NAMESPACE = 'jetpack/forms/override-block-category';

// Store original categories to restore later
const originalBlockCategories: Map< string, string > = new Map();

interface BlockType {
	name: string;
	category?: string;
	formEditorCategory?: string;
	[ key: string ]: unknown;
}

/**
 * Filter callback that overrides block categories for form field blocks.
 *
 * This reads the `formEditorCategory` property from the block settings
 * and maps it to the full form category slug.
 *
 * @param settings - The block settings object
 * @param name     - The block name
 * @return Modified settings with updated category, or original settings
 */
function overrideBlockCategory( settings: BlockType, name: string ): BlockType {
	const { formEditorCategory, category } = settings;

	if ( ! formEditorCategory || ! category ) {
		return settings;
	}

	const formCategorySlug = getFormCategorySlug( formEditorCategory );

	if ( ! formCategorySlug ) {
		return settings;
	}

	// Store original category if not already stored
	if ( ! originalBlockCategories.has( name ) ) {
		originalBlockCategories.set( name, category );
	}

	return {
		...settings,
		category: formCategorySlug,
	};
}

/**
 * Activates block category overrides for the form editor.
 *
 * Uses the 'blocks.registerBlockType' filter to change categories
 * for blocks that have a `formEditorCategory` setting.
 *
 * Note: This filter runs at registration time, so for already-registered
 * blocks we need to re-process them using the data store.
 */
export function activateBlockCategoryOverrides(): void {
	// Add filter for future block registrations
	addFilter( 'blocks.registerBlockType', FILTER_NAMESPACE, overrideBlockCategory );

	// For already-registered blocks, we need to update them via the data store
	const { getBlockTypes } = select( 'core/blocks' ) as {
		getBlockTypes: () => BlockType[];
	};

	const blockTypes = getBlockTypes();

	for ( const blockType of blockTypes ) {
		if ( blockType.formEditorCategory && blockType.category ) {
			const formCategorySlug = getFormCategorySlug( blockType.formEditorCategory );
			if ( formCategorySlug && blockType.category !== formCategorySlug ) {
				// Store original category
				if ( ! originalBlockCategories.has( blockType.name ) ) {
					originalBlockCategories.set( blockType.name, blockType.category );
				}
				// Update the block type's category
				blockType.category = formCategorySlug;
			}
		}
	}
}

/**
 * Deactivates block category overrides and restores original categories.
 *
 * This should be called when leaving the form editor to restore
 * blocks to their original 'contact-form' category.
 */
export function deactivateBlockCategoryOverrides(): void {
	// Remove the filter
	removeFilter( 'blocks.registerBlockType', FILTER_NAMESPACE );

	// Restore original categories for all affected blocks
	const { getBlockTypes } = select( 'core/blocks' ) as {
		getBlockTypes: () => BlockType[];
	};

	const blockTypes = getBlockTypes();

	for ( const blockType of blockTypes ) {
		const originalCategory = originalBlockCategories.get( blockType.name );
		if ( originalCategory ) {
			blockType.category = originalCategory;
		}
	}

	// Clear stored categories
	originalBlockCategories.clear();
}
