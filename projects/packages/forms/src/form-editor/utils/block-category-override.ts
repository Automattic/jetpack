/**
 * Block category override utilities
 *
 * Provides functions to dynamically override block categories in the
 * Jetpack Form editor using WordPress filters and the reapplyBlockTypeFilters
 * dispatch action.
 *
 * @package
 */

import { dispatch } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { childBlocks } from '../../blocks/contact-form/child-blocks.js';
import { getFormCategorySlug } from './form-categories';

const FILTER_NAMESPACE = 'jetpack/forms/override-block-category';

/**
 * Flag to track whether the form editor category overrides are active.
 * This is used by the filter to conditionally apply category changes.
 */
let isFormEditorActive = false;

interface BlockSettings {
	name?: string;
	category?: string;
	supports?: {
		[ key: string ]: unknown;
	};
	[ key: string ]: unknown;
}

interface ChildBlock {
	name: string;
	setting: BlockSettings;
	form_editor?: {
		category: string;
	};
}

let formEditorChildBlockCategoriesMapping;

/**
 * Filter callback that overrides block categories for form field blocks.
 *
 * This reads the category from each child block's `form_editor.category` field and maps
 * it to the full form category slug when the form editor is active.
 *
 * @param settings - The block settings object
 * @param name     - The block name
 * @return Modified settings with updated category, or original settings
 */
function overrideBlockCategory( settings: BlockSettings, name: string ): BlockSettings {
	// Only apply overrides when form editor is active
	if ( ! isFormEditorActive ) {
		return settings;
	}

	if ( ! formEditorChildBlockCategoriesMapping ) {
		formEditorChildBlockCategoriesMapping = {};
		for ( const childBlock of childBlocks ) {
			const childBlockWithEditor = childBlock as unknown as ChildBlock;
			if ( childBlockWithEditor?.form_editor?.category ) {
				formEditorChildBlockCategoriesMapping[ `jetpack/${ childBlockWithEditor.name }` ] =
					getFormCategorySlug( childBlockWithEditor.form_editor.category );
			}
		}
	}

	const categorySlug = formEditorChildBlockCategoriesMapping?.[ name ];

	if ( ! categorySlug ) {
		return settings;
	}

	return {
		...settings,
		category: categorySlug,
	};
}

/**
 * Activates block category overrides for the form editor.
 *
 * This adds a filter on `blocks.registerBlockType` and then calls
 * `reapplyBlockTypeFilters` to re-process all registered blocks
 * with the new filter active.
 */
export function activateBlockCategoryOverrides(): void {
	if ( isFormEditorActive ) {
		return;
	}

	isFormEditorActive = true;

	// Add filter for block type registration
	addFilter( 'blocks.registerBlockType', FILTER_NAMESPACE, overrideBlockCategory );

	// Reapply filters to all already-registered blocks
	const { reapplyBlockTypeFilters } = dispatch( 'core/blocks' ) as {
		reapplyBlockTypeFilters: () => void;
	};
	reapplyBlockTypeFilters();
}

/**
 * Deactivates block category overrides and restores original categories.
 *
 * This removes the filter and calls `reapplyBlockTypeFilters` to
 * re-process all blocks without the override, restoring them to
 * their original categories.
 */
export function deactivateBlockCategoryOverrides(): void {
	if ( ! isFormEditorActive ) {
		return;
	}

	isFormEditorActive = false;

	// Remove the filter
	removeFilter( 'blocks.registerBlockType', FILTER_NAMESPACE );

	// Reapply filters to restore original categories
	const { reapplyBlockTypeFilters } = dispatch( 'core/blocks' ) as {
		reapplyBlockTypeFilters: () => void;
	};
	reapplyBlockTypeFilters();
}
