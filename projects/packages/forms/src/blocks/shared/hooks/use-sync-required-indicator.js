import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { useSyncedAttributes } from './use-synced-attributes.jsx';

/**
 * Syncs `requiredIndicator` verticall between parent field and nested label,
 * and also horizontally across form fields if isSynced is true.
 *
 * @param {object}   opts               - Options.
 * @param {string}   opts.clientId      - Parent field block client ID.
 * @param {string}   opts.blockName     - Sync group key (e.g., 'jetpack/field-sync' or per-type name).
 * @param {boolean}  opts.isSynced      - Whether field attributes are shared (`shareFieldAttributes`).
 * @param {object}   opts.attributes    - Field attributes object.
 * @param {Function} opts.setAttributes - Field setAttributes function.
 * @return {void}
 */
export const useSyncRequiredIndicator = ( {
	clientId,
	blockName,
	isSynced,
	attributes,
	setAttributes,
} ) => {
	// Syncs horizontally across form fields if isSynced is true.
	useSyncedAttributes( blockName, isSynced, [ 'requiredIndicator' ], attributes, setAttributes );

	// Synces verticall between label and parent.
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
			updateBlockAttributes( labelClientId, { requiredIndicator: attributes?.requiredIndicator } );
		}
	}, [ labelClientId, attributes?.requiredIndicator, updateBlockAttributes ] );
};
export default useSyncRequiredIndicator;
