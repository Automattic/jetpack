/**
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import type { Block } from '../types.js';

/**
 * Recursively get all blocks from the post, including nested innerBlocks
 * @return {Array} Array of all blocks in the post
 */
export const getAllBlocks = (): Array< Block > => {
	const topLevelBlocks = select( 'core/block-editor' ).getBlocks();
	const allBlocks: Array< Block > = [];

	const processBlock = ( block: Block ) => {
		allBlocks.push( block );

		if ( block.innerBlocks?.length ) {
			block.innerBlocks.forEach( processBlock );
		}
	};

	topLevelBlocks.forEach( processBlock );

	return allBlocks;
};
