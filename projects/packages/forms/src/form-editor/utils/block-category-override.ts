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
	formEditorCategory?: string;
	[ key: string ]: unknown;
}

/**
 * Filter callback that overrides block categories for form field blocks.
 *
 * This reads the `formEditorCategory` property from the block settings
 * and maps it to the full form category slug when the form editor is active.
 *
 * @param settings - The block settings object
 * @return Modified settings with updated category, or original settings
 */
function overrideBlockCategory( settings: BlockSettings ): BlockSettings {
	// Only apply overrides when form editor is active
	if ( ! isFormEditorActive ) {
		return settings;
	}

	const { formEditorCategory, category } = settings;

	if ( ! formEditorCategory || ! category ) {
		return settings;
	}

	const formCategorySlug = getFormCategorySlug( formEditorCategory );

	if ( ! formCategorySlug ) {
		return settings;
	}

	return {
		...settings,
		category: formCategorySlug,
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
