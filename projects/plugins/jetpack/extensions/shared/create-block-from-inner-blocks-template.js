import { createBlocksFromInnerBlocksTemplate, createBlock } from '@wordpress/blocks';

/**
 * This is a helper function that acts as a fallback
 * for the core `createBlocksFromInnerBlocksTemplate()` function.
 * This function is not available for the different Jetpack versions
 * that a WordPress site currently could get.
 *
 * @param {Array} innerBlocksOrTemplate - Nested blocks or InnerBlocks templates.
 * @returns {Object[]} Array of Block objects.
 */
export default function createBlocksFromTemplate( innerBlocksOrTemplate = [] ) {
	if ( typeof createBlocksFromInnerBlocksTemplate !== 'undefined' ) {
		return createBlocksFromInnerBlocksTemplate( innerBlocksOrTemplate );
	}

	return innerBlocksOrTemplate.map( innerBlock => {
		const innerBlockTemplate = Array.isArray( innerBlock )
			? innerBlock
			: [ innerBlock.name, innerBlock.attributes, innerBlock.innerBlocks ];
		const [ name, attributes, innerBlocks = [] ] = innerBlockTemplate;

		return createBlock( name, attributes, createBlocksFromTemplate( innerBlocks ) );
	} );
}
