import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { generateUniqueFormFieldId } from '../../shared/util/generate-unique-id.js';
import {
	FIRST_NAME_ID,
	LAST_NAME_ID,
	NAME_ID,
	DEFAULT_FIRST_NAME_LABEL,
	DEFAULT_LAST_NAME_LABEL,
	DEFAULT_NAME_LABEL,
} from '../variations.js';

const getDefaultLabelForId = id => {
	if ( id === FIRST_NAME_ID ) return DEFAULT_FIRST_NAME_LABEL;
	if ( id === LAST_NAME_ID ) return DEFAULT_LAST_NAME_LABEL;
	return DEFAULT_NAME_LABEL;
};

/**
 * Manages unique IDs and default labels for Name field variations during transforms.
 *
 * Behavior:
 * - On transform to Name/First/Last, assigns a unique id based on the variant
 * (e.g., 'name', 'name-2', 'first-name', 'first-name-2') and sets the default label.
 * - No-ops when fieldVariant is empty or custom/non-variant.
 *
 * @param {object} params              - Hook parameters.
 * @param {string} params.clientId     - Name field block clientId.
 * @param {string} params.fieldVariant - Current field variant ('name' | 'first-name' | 'last-name').
 */
export default function useNameFieldTransforms( { clientId, fieldVariant } ) {
	const prevVariantRef = useRef( fieldVariant );
	const isTransforming = !! fieldVariant && prevVariantRef.current !== fieldVariant;
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const baseId = fieldVariant || NAME_ID;
	const finalLabel = getDefaultLabelForId( baseId );

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

	const finalId = generateUniqueFormFieldId( baseId, existingFieldIds );

	const labelClientId = useSelect(
		select => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const labelBlock = block?.innerBlocks?.find( b => b.name === 'jetpack/label' );
			return labelBlock?.clientId;
		},
		[ clientId ]
	);

	// Set HTML ID on the name field block.
	useEffect( () => {
		if ( isTransforming ) {
			updateBlockAttributes( clientId, { id: finalId } );
		}
	}, [ finalId, clientId, updateBlockAttributes, isTransforming ] );

	// Set label on the label block.
	useEffect( () => {
		if ( ! labelClientId || ! isTransforming ) {
			return;
		}
		updateBlockAttributes( labelClientId, { label: finalLabel } );
	}, [ finalLabel, labelClientId, updateBlockAttributes, isTransforming ] );

	// Track previous variant.
	useEffect( () => {
		prevVariantRef.current = fieldVariant;
	}, [ fieldVariant ] );
}
