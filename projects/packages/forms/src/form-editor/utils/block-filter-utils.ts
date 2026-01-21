/**
 * Pure utility functions for block filtering.
 *
 * These functions have no external dependencies and can be easily tested.
 *
 * @package
 */

/**
 * Child block type definition for filtering.
 */
export interface ChildBlock {
	name: string;
	settings: {
		parent?: string | string[];
	};
}

/**
 * Filters child blocks to get only those that can be used in a parent block.
 * A block is valid if it has no parent restriction, or if its parent includes the specified parent block name.
 *
 * @param blocks          - Array of child block definitions
 * @param parentBlockName - The parent block name to filter by (e.g., 'jetpack/contact-form')
 * @return Array of valid field block names (with jetpack/ prefix)
 */
export function getValidFormFieldBlocks( blocks: ChildBlock[], parentBlockName: string ): string[] {
	return blocks
		.filter( childBlock => {
			const { parent } = childBlock.settings;
			return (
				! parent ||
				parent === parentBlockName ||
				( Array.isArray( parent ) && parent.includes( parentBlockName ) )
			);
		} )
		.map( block => `jetpack/${ block.name }` );
}

/**
 * Determines which blocks should be hidden based on the allowed blocks list.
 *
 * @param allBlockNames - Array of all registered block names
 * @param allowedBlocks - Set of allowed block names
 * @return Array of block names to hide
 */
export function getBlocksToHide( allBlockNames: string[], allowedBlocks: Set< string > ): string[] {
	return allBlockNames.filter( blockName => ! allowedBlocks.has( blockName ) );
}
