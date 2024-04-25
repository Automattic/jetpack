/**
 * External dependencies
 */
import type { Block } from '@automattic/jetpack-ai-client';

const omitClientId = ( block: Block ): Block => {
	delete block.clientId;

	for ( const child of block.innerBlocks ?? [] ) {
		omitClientId( child );
	}

	return block;
};

const copyBlock = ( block: Block ): Block => JSON.parse( JSON.stringify( block ) );
const copyBlockWithoutClientId = ( block: Block ) => omitClientId( copyBlock( block ) );

/**
 * Deeply compares two blocks, ignoring the clientId property.
 *
 * @param {Block} blockA - The first block to compare.
 * @param {Block} blockB - The second block to compare.
 * @returns {boolean} Whether the two blocks are equal.
 */
export function compareBlocks( blockA: Block, blockB: Block ): boolean {
	const aCopy = copyBlockWithoutClientId( blockA );
	const bCopy = copyBlockWithoutClientId( blockB );

	return JSON.stringify( aCopy ) === JSON.stringify( bCopy );
}
