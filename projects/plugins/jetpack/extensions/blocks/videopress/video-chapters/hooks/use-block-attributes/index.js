/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

export default function useBlockAttributes() {
	const { clientId, attributes } = useSelect( select => {
		const _clientId = select( blockEditorStore ).getSelectedBlockClientId();

		return {
			clientId: _clientId,
			attributes: _clientId
				? select( 'core/block-editor' ).getBlockAttributes( _clientId )
				: undefined,
		};
	} );

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setAttributes = newAttributes => updateBlockAttributes( clientId, newAttributes );

	return { clientId, attributes, setAttributes };
}
