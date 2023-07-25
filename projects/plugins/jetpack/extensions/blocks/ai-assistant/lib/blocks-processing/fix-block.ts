/**
 * External dependencies
 */
import { parse } from '@wordpress/blocks';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { rebuildSaveContent } from './rebuild-save-content';

const debug = debugFactory( 'jetpack-ai-assistant:block-processing' );

export const fixBlock = block => {
	if ( block.isValid ) {
		return block;
	}

	debug( 'Invalid block: %o', block );
	const { rebuiltContentOriginalAttributes, rebuiltContentNewAttributes } =
		rebuildSaveContent( block );

	// Check if the block is valid with the original attributes first
	const parsedBlockArrayOriginal = parse( rebuiltContentOriginalAttributes );
	const recoveredBlockOriginal = parsedBlockArrayOriginal[ 0 ];

	if ( recoveredBlockOriginal.isValid ) {
		debug( 'Recovered block: %o', recoveredBlockOriginal );
		return recoveredBlockOriginal;
	}

	// Check if the block is valid with the new attributes
	const parsedBlockArrayNew = parse( rebuiltContentNewAttributes );
	const recoveredBlockNew = parsedBlockArrayNew[ 0 ];

	if ( recoveredBlockNew.isValid ) {
		debug( 'Recovered block: %o', recoveredBlockNew );
		return recoveredBlockNew;
	}

	debug( 'Unrecoverable block: %o', block );
	return null;
};
