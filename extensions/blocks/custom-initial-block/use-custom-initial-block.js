/**
 * Internal dependencies
 */
import { get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

export default function useCustomInitialBlock() {
	const { postBlocks } = useSelect( select => ( {
		postBlocks: select( 'core/block-editor' ).getBlocks(),
	} ) );
	const { insertBlock, replaceBlock } = useDispatch( 'core/block-editor' );

	const setCustomInitialBlock = block => () => {
		if ( isEmpty( postBlocks ) ) {
			return insertBlock( createBlock( block ), 0 );
		}

		if ( postBlocks.length === 1 && isEmpty( get( postBlocks, [ 0, 'attributes', 'content' ] ) ) ) {
			return replaceBlock( get( postBlocks, [ 0, 'clientId' ] ), createBlock( block ) );
		}

		const reloadUrl = addQueryArgs( document.location.href, { 'custom-initial-block': block } );
		document.location.href = reloadUrl;
	};

	return { setCustomInitialBlock };
}
