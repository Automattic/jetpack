import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import {
	FIRST_NAME_ID,
	LAST_NAME_ID,
	DEFAULT_FIRST_NAME_LABEL,
	DEFAULT_LAST_NAME_LABEL,
	DEFAULT_NAME_LABEL,
} from '../variations.js';

const isKnownId = id => id === FIRST_NAME_ID || id === LAST_NAME_ID;

const getDefaultLabelForId = id => {
	if ( id === FIRST_NAME_ID ) return DEFAULT_FIRST_NAME_LABEL;
	if ( id === LAST_NAME_ID ) return DEFAULT_LAST_NAME_LABEL;
	return DEFAULT_NAME_LABEL;
};

/**
 * Sync the nested label text with the Name field's variation id when users transform
 * between known variations (first-name/last-name).
 *
 * @param {object} params          - Parameters.
 * @param {string} params.clientId - Block clientId for the Name field
 * @param {string} params.id       - Current variation id (e.g., 'first-name' | 'last-name')
 */
export default function useNameLabelSync( { clientId, id } ) {
	const prevIdRef = useRef( id );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const labelClientId = useSelect(
		select => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const labelBlock = block?.innerBlocks?.find( b => b.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	const currentLabel = useSelect(
		select => {
			return labelClientId
				? select( blockEditorStore ).getBlockAttributes( labelClientId )?.label
				: undefined;
		},
		[ labelClientId ]
	);

	useEffect( () => {
		const newId = id;
		const prevId = prevIdRef.current;

		if ( ! labelClientId ) {
			prevIdRef.current = newId;
			return;
		}

		// Handle transforms between known variations.
		if ( isKnownId( newId ) && newId !== prevId ) {
			const nextDefault = getDefaultLabelForId( newId );
			// Ensure the parent block id matches the variation id.
			if ( newId ) {
				updateBlockAttributes( clientId, { id: newId } );
			}
			// Always set the label to the default for the selected variation.
			updateBlockAttributes( labelClientId, { label: nextDefault } );
		}

		// Handle transforms from a known variation back to the base Name (no id).
		const becameBase = isKnownId( prevId ) && ( newId === undefined || newId === '' );
		if ( becameBase ) {
			// Clear the parent block id when returning to base.
			updateBlockAttributes( clientId, { id: '' } );
			// Always set the label back to the base default.
			updateBlockAttributes( labelClientId, { label: DEFAULT_NAME_LABEL } );
		}

		prevIdRef.current = newId;
	}, [ id, clientId, labelClientId, currentLabel, updateBlockAttributes ] );
}
