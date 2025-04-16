import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FORM_BLOCK_NAME } from '../util/constants';

export default function useFormWrapper( { attributes, clientId, name } ) {
	const { replaceBlock, __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );
	const { getBlocks } = useSelect( blockEditorStore );

	const parentForms = useSelect(
		select => {
			return select( blockEditorStore ).getBlockParentsByBlockName( clientId, FORM_BLOCK_NAME );
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! parentForms?.length ) {
			// As this is an automated update, ensure it doesn't end up in the undo stack
			// by calling `__unstableMarkNextChangeAsNotPersistent`.
			__unstableMarkNextChangeAsNotPersistent();
			replaceBlock(
				clientId,
				createBlock( FORM_BLOCK_NAME, {}, [
					createBlock( name, attributes, getBlocks( clientId ) ),
					createBlock( 'jetpack/button', {
						text: __( 'Submit', 'jetpack-forms' ),
						element: 'button',
						lock: { remove: true },
					} ),
				] )
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
}
