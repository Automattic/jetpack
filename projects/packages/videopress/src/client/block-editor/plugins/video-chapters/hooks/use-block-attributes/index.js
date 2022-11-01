/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * React hook to get the block attributes,
 * to be used into the block edit component function context.
 *
 * @returns {object} - Block attributes.
 */
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
