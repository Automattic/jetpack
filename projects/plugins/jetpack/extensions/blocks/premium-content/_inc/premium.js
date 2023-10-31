import { store as blocksStore } from '@wordpress/blocks';
import { select, useSelect } from '@wordpress/data';
import { name } from '../index';

export const blockContainsPremiumBlock = block => {
	if ( block.name.indexOf( 'premium-content/' ) === 0 ) {
		return true;
	}

	return block.innerBlocks.some( blockContainsPremiumBlock );
};

export const blockHasParentPremiumBlock = block => {
	const { getBlocksByClientId, getBlockParents } = select( 'core/block-editor' );
	const parents = getBlocksByClientId( getBlockParents( block.clientId ) );
	return !! parents.find( parent => parent.name.indexOf( 'premium-content/' ) === 0 );
};

export function usePremiumContentAllowedBlocks() {
	const blockTypes = useSelect( selector => selector( blocksStore ).getBlockTypes(), [] );

	return blockTypes.reduce( ( allowedBlocks, block ) => {
		if ( block.name !== name ) {
			allowedBlocks.push( block.name );
		}
		return allowedBlocks;
	}, [] );
}
