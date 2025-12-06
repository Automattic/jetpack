import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, serialize } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

interface UseConvertToReusableFormOptions {
	clientId: string;
}

interface UseConvertToReusableFormReturn {
	convertToReusableForm: () => Promise< void >;
	isConverting: boolean;
}

/**
 * Hook to convert a contact form block to a reusable form.
 *
 * @param {UseConvertToReusableFormOptions} options          - Hook options
 * @param {string}                          options.clientId - The client ID of the block to convert
 * @return {UseConvertToReusableFormReturn} An object containing the conversion function and loading state
 */
export function useConvertToReusableForm( {
	clientId,
}: UseConvertToReusableFormOptions ): UseConvertToReusableFormReturn {
	const [ isConverting, setIsConverting ] = useState( false );

	const block = useSelect(
		select => {
			return select( blockEditorStore ).getBlock( clientId );
		},
		[ clientId ]
	);

	const { replaceBlock } = useDispatch( blockEditorStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const convertToReusableForm = useCallback( async () => {
		if ( ! block || isConverting ) {
			return;
		}

		setIsConverting( true );

		try {
			// Serialize the current block to HTML
			const content = serialize( block );

			// Create a new jetpack-form post
			const response = await apiFetch< { id: number } >( {
				path: '/wp/v2/jetpack-forms',
				method: 'POST',
				data: {
					title: __( 'Reusable Form', 'jetpack-forms' ),
					content,
					status: 'publish',
				},
			} );

			// Create a new jetpack/form block with a reference to the created post
			const newBlock = createBlock( 'jetpack/form', {
				ref: response.id,
			} );

			// Replace the current block with the new reusable form block
			replaceBlock( clientId, newBlock );

			// Show success notice
			createSuccessNotice( __( 'Form converted to reusable form', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch ( error ) {
			// Show error notice
			createErrorNotice( __( 'Failed to convert form. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			setIsConverting( false );
		}
		// Note: We don't reset isConverting on success because the block will be replaced
	}, [ block, clientId, isConverting, replaceBlock, createSuccessNotice, createErrorNotice ] );

	return {
		convertToReusableForm,
		isConverting,
	};
}
