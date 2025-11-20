import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { generateUniqueFormFieldId } from '../../shared/util/generate-unique-id.js';
import {
	FIRST_NAME_ID,
	LAST_NAME_ID,
	NAME_ID,
	DEFAULT_FIRST_NAME_LABEL,
	DEFAULT_LAST_NAME_LABEL,
	DEFAULT_NAME_LABEL,
	isFirstNameVariationId,
	isLastNameVariationId,
	isKnownNameVariationId,
} from '../variations.js';

const getDefaultLabelForId = id => {
	if ( id === FIRST_NAME_ID ) return DEFAULT_FIRST_NAME_LABEL;
	if ( id === LAST_NAME_ID ) return DEFAULT_LAST_NAME_LABEL;
	return DEFAULT_NAME_LABEL;
};

/**
 * Ensure Name-field variations keep correct, unique ids and default labels.
 *
 * Behavior:
 * - On transform to Name/First/Last, assigns a unique id based on the variant
 * (e.g., 'name', 'name-2', 'first-name', 'first-name-2') and sets the default label.
 * - On transform back to the base Name field (empty id), clears id and restores the base label.
 * - No-ops when id is custom/non-variant.
 *
 * @param {object} params          - Hook parameters.
 * @param {string} params.clientId - Name field block clientId.
 * @param {string} params.id       - Current field id (used to infer variant).
 */
export default function useSetFieldIdAndLabel( { clientId, id } ) {
	const prevIdRef = useRef( id );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const existingFieldIds = useSelect(
		select => {
			const { getBlock, getBlocks, getBlockParents } = select( blockEditorStore );
			const parentIds = getBlockParents( clientId ) || [];
			const formRootId = parentIds.find( parentId => {
				const parent = getBlock( parentId );
				return parent?.name === 'jetpack/contact-form';
			} );
			const siblings = formRootId ? getBlocks( formRootId ) : getBlocks();
			return siblings
				.filter( block => block.clientId !== clientId && block.attributes?.id )
				.map( block => block.attributes.id );
		},
		[ clientId ]
	);

	const labelClientId = useSelect(
		select => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const labelBlock = block?.innerBlocks?.find( b => b.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	// Derive block context details once per ID change.
	const context = useMemo( () => {
		const newId = id;
		const prevId = prevIdRef.current;
		const isBaseFormBlock =
			isKnownNameVariationId( prevId ) && ( newId === undefined || newId === '' );
		const isTransform = isKnownNameVariationId( newId ) && newId !== prevId;

		let baseId = NAME_ID;
		if ( isFirstNameVariationId( newId ) ) {
			baseId = FIRST_NAME_ID;
		} else if ( isLastNameVariationId( newId ) ) {
			baseId = LAST_NAME_ID;
		}

		return {
			isBaseFormBlock,
			isTransform,
			baseId,
			label: getDefaultLabelForId( baseId ),
		};
	}, [ id ] );

	// Set HTML ID on the name field block.
	useEffect( () => {
		if ( context.isBaseFormBlock ) {
			// Only clear the id if it isn't already empty to avoid loops.
			if ( id !== '' ) {
				updateBlockAttributes( clientId, { id: '' } );
			}
			return;
		}
		if ( context.isTransform ) {
			const uniqueId = generateUniqueFormFieldId( context.baseId, existingFieldIds );
			// Only set the id when it actually changes to avoid loops.
			if ( id !== uniqueId ) {
				updateBlockAttributes( clientId, { id: uniqueId } );
			}
		}
	}, [ context, id, clientId, updateBlockAttributes, existingFieldIds ] );

	// Set label on the label block.
	useEffect( () => {
		if ( ! labelClientId ) {
			return;
		}
		if ( context.isBaseFormBlock ) {
			updateBlockAttributes( labelClientId, { label: DEFAULT_NAME_LABEL } );
			return;
		}
		if ( context.isTransform ) {
			updateBlockAttributes( labelClientId, { label: context.label } );
		}
	}, [ context, labelClientId, updateBlockAttributes ] );

	// Effect C: track previous id
	useEffect( () => {
		prevIdRef.current = id;
	}, [ id ] );
}
