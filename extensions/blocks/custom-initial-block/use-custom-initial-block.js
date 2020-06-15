/**
 * Internal dependencies
 */
import { get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

export default function useCustomInitialBlock() {
	const { postBlocks } = useSelect( select => ( {
		postBlocks: select( 'core/block-editor' ).getBlocks(),
	} ) );
	const { insertBlock, replaceBlock } = useDispatch( 'core/block-editor' );
	const [ isSaving, setIsSaving ] = useState( false );

	const setCustomInitialBlock = block => async () => {
		setIsSaving( true );

		let shouldReload = true;
		if ( isEmpty( postBlocks ) ) {
			shouldReload = false;
			insertBlock( createBlock( block ), 0 );
		} else if (
			postBlocks.length === 1 &&
			isEmpty( get( postBlocks, [ 0, 'attributes', 'content' ] ) )
		) {
			shouldReload = false;
			replaceBlock( get( postBlocks, [ 0, 'clientId' ] ), createBlock( block ) );
		}

		await apiFetch( {
			path: '/wpcom/v2/custom-initial-block',
			method: 'POST',
			data: { block },
		} );

		setIsSaving( false );

		if ( ! shouldReload ) {
			return;
		}

		document.location.href = addQueryArgs( document.location.href, {
			'custom-initial-block': block,
		} );
	};

	return { isSaving, setCustomInitialBlock };
}
