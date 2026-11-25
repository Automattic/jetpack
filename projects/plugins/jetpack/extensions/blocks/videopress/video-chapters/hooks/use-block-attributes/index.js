/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

export default function useBlockAttributes() {
	const clientId = useSelect( select => select( blockEditorStore ).getSelectedBlockClientId(), [] );
	const attributes = useSelect(
		select => ( clientId ? select( blockEditorStore ).getBlockAttributes( clientId ) : undefined ),
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const setAttributes = newAttributes => updateBlockAttributes( clientId, newAttributes );

	return { clientId, attributes, setAttributes };
}
