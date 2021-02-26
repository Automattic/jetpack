/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

export const blockContainsPremiumBlock = ( block ) => {
	if ( block.name.indexOf( 'premium-content/' ) === 0 ) {
		return true;
	}

	return block.innerBlocks.some( blockContainsPremiumBlock );
};

export const blockHasParentPremiumBlock = ( block ) => {
	const { getBlocksByClientId, getBlockParents } = select( 'core/block-editor' );
	const parents = getBlocksByClientId( getBlockParents( block.clientId ) );
	return !! parents.find( ( parent ) => parent.name.indexOf( 'premium-content/' ) === 0 );
};
