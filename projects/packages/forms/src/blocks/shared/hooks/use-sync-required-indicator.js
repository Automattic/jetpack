import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Synchronize the nested `jetpack/label` block's `requiredIndicator` attribute
 * with its parent field block.
 *
 * Ensures that toggling "Show required text" at the field level updates the
 * inner label block immediately, keeping editor UI and saved attributes in sync.
 *
 * @param {string}  clientId          - The parent field block client ID.
 * @param {boolean} requiredIndicator - Whether to display the required indicator text.
 * @return {void}
 */
export const useSyncRequiredIndicator = ( clientId, requiredIndicator ) => {
	const labelClientId = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );
			const parentBlock = getBlock( clientId );
			if ( ! parentBlock ) {
				return undefined;
			}
			const labelBlock = parentBlock.innerBlocks.find( block => block.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( labelClientId ) {
			updateBlockAttributes( labelClientId, { requiredIndicator } );
		}
	}, [ labelClientId, requiredIndicator, updateBlockAttributes ] );
};
export default useSyncRequiredIndicator;
