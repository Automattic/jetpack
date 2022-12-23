import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const validateFormWrapper = ( { attributes, clientId, name } ) => {
	const FORM_BLOCK_NAME = 'jetpack/contact-form';
	const BUTTON_BLOCK_NAME = 'jetpack/button';
	const SUBMIT_BUTTON_ATTR = {
		text: __( 'Submit', 'jetpack' ),
		element: 'button',
		lock: { remove: true },
	};

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { replaceBlock } = useDispatch( blockEditorStore );

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const parents = useSelect( select => {
		return select( blockEditorStore ).getBlockParentsByBlockName( clientId, FORM_BLOCK_NAME );
	} );

	// eslint-disable-next-line react-hooks/rules-of-hooks
	useEffect( () => {
		if ( ! parents?.length ) {
			replaceBlock(
				clientId,
				createBlock( FORM_BLOCK_NAME, {}, [
					createBlock( name, attributes ),
					createBlock( BUTTON_BLOCK_NAME, SUBMIT_BUTTON_ATTR ),
				] )
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
};
