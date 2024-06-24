/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

export const findBlockRecursively = ( clientId, blocks ) => {
	const block = blocks.find( currentBlock => currentBlock.clientId === clientId );

	if ( block ) {
		return block;
	}

	// If the block was not found, check the inner blocks
	for ( const currentBlock of blocks ) {
		if ( currentBlock.innerBlocks?.length > 0 ) {
			const innerBlock = findBlockRecursively( clientId, currentBlock.innerBlocks );

			if ( innerBlock ) {
				return innerBlock;
			}
		}
	}

	return null;
};

// messageHandler.js
export const handleMessage = event => {
	const { clientId, aiReplacementText, updateFunc } = event;
	const { getBlocks } = select( 'core/block-editor' );
	const { selectBlock, updateBlockAttributes } = dispatch( 'core/block-editor' );

	const updateBlocks = attributes => {
		selectBlock( clientId );
		updateBlockAttributes( clientId, attributes );
	};

	const block = findBlockRecursively( clientId, getBlocks() );

	if ( block ) {
		updateBlocks( { content: aiReplacementText } );
		updateFunc();
	}
};
