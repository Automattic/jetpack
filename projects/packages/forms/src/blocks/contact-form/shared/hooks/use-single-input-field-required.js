import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { getInputFields } from '../../util/get-input-fields.ts';

/**
 * Make a form's only input field required.
 *
 * A form with a single field has nothing to submit unless that field is filled
 * in, so leaving it optional is never what the author meant.
 *
 * @param {object} params             - Hook parameters.
 * @param {Array}  params.innerBlocks - The form's inner blocks.
 */
export default function useSingleInputFieldRequired( { innerBlocks } ) {
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	useEffect( () => {
		const inputFields = getInputFields( innerBlocks );

		if ( inputFields.length !== 1 ) {
			return;
		}

		const singleField = inputFields[ 0 ];

		if ( singleField.attributes?.required ) {
			return;
		}

		/*
		 * Nobody asked for this, so it must not count as an edit. Otherwise a
		 * one-field form -- a footer newsletter signup, say -- opens its post,
		 * template, or template part with unsaved changes on every load.
		 */
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( singleField.clientId, { required: true } );
	}, [ innerBlocks, updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent ] );
}
