import { registerBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { CAROUSEL_BLOCK_NAME } from '../consts';
import { settings } from '../synced-newspack-blocks/blocks/carousel';

/**
 * Set the name of the block transformation
 *
 * @param {string} name - The name of the block
 * @return {string} The potentially-transformed block name
 */
function setBlockTransformationName( name ) {
	return name !== 'newspack-blocks/carousel' ? name : CAROUSEL_BLOCK_NAME;
}

addFilter(
	'blocks.transforms_from_name',
	'set-transformed-block-name',
	setBlockTransformationName
);

registerBlockType( CAROUSEL_BLOCK_NAME, {
	...settings,
	category: 'widgets',
} );
