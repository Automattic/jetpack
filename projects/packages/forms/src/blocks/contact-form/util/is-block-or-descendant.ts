/**
 * External dependencies
 */
import { select } from '@wordpress/data';
/**
 * Types
 */
import type { BlockEditorStoreSelect } from '../../../types';

export const isBlockOrDescendant = ( blockClientId: string, blockName: string ): boolean => {
	const { getBlock, getBlockRootClientId } = select(
		'core/block-editor'
	) as BlockEditorStoreSelect;

	if ( ! blockClientId ) {
		return false;
	}

	const block = getBlock( blockClientId );
	if ( block?.name === blockName ) {
		return true;
	}

	const parentId = getBlockRootClientId( blockClientId );
	if ( ! parentId ) {
		return false;
	}

	return isBlockOrDescendant( parentId, blockName );
};
