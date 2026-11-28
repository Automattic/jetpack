import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import {
	isFirstNameVariationId,
	isLastNameVariationId,
	FIRST_NAME_ID,
	LAST_NAME_ID,
	NAME_ID,
} from '../variations.js';

/**
 * Backfill fieldVariant on Name fields saved before the attribute existed.
 *
 * The stored HTML id is the only clue those blocks carry about which variation
 * the author picked, so the variant is derived from it.
 *
 * @param {object}   params               - Hook parameters.
 * @param {string}   params.id            - The field's HTML id.
 * @param {string}   params.fieldVariant  - The field's current variant, if any.
 * @param {Function} params.setAttributes - Setter for block attributes.
 */
export default function useFieldVariantDefault( { id, fieldVariant, setAttributes } ) {
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( fieldVariant ) {
			return;
		}

		let variant = NAME_ID;
		if ( isFirstNameVariationId( id ) ) {
			variant = FIRST_NAME_ID;
		} else if ( isLastNameVariationId( id ) ) {
			variant = LAST_NAME_ID;
		}

		// Backfilling an attribute the block did not have yet is not a user edit,
		// so it must not mark the post or template holding the form as changed.
		__unstableMarkNextChangeAsNotPersistent();
		setAttributes( { fieldVariant: variant } );
	}, [ fieldVariant, id, setAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}
