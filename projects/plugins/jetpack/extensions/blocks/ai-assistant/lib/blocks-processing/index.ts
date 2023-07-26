/**
 * Internal dependencies
 */
import { process as processCover } from './cover';
import { fixBlock } from './fix-block';

const processSimpleBlock = block => {
	if ( block.isValid ) {
		return block;
	}

	return fixBlock( block );
};

export const processBlock = block => {
	// Process inner blocks first
	block.innerBlocks = ( block.innerBlocks ?? [] )
		.map( processBlock )
		.filter( innerBlock => innerBlock != null );

	switch ( block.name ) {
		case 'core/cover':
			return processCover( block );
		case 'core/table':
		case 'core/image':
		case 'core/column':
			return processSimpleBlock( block );
		default:
			return block.isValid ? block : null;
	}
};
