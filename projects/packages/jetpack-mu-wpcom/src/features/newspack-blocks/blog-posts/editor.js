import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { CAROUSEL_BLOCK_NAME } from '../consts';
import { settings } from '../synced-newspack-blocks/blocks/homepage-articles';
import { registerQueryStore } from '../synced-newspack-blocks/blocks/homepage-articles/store';

/**
 * Block name in the A8C\FSE context.
 */
const blockName = 'a8c/blog-posts';

/**
 * Set the name of the block transformation
 *
 * @param {string} name - The name of the block
 * @return {string} The potentially-transformed block name
 */
function setBlockTransformationName( name ) {
	return name !== 'newspack-blocks/homepage-articles' ? name : blockName;
}

addFilter(
	'blocks.transforms_from_name',
	'set-transformed-block-name',
	setBlockTransformationName
);

registerBlockType( blockName, {
	...settings,
	title: __( 'Blog Posts', 'jetpack-mu-wpcom' ),
	category: 'widgets',
} );

// The Blog Posts block and Carousel block should use the same store, so that deduplication is handled
// between these blocks.
registerQueryStore( [ blockName, CAROUSEL_BLOCK_NAME ] );
