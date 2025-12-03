/**
 * Hook to create a jetpack-form CPT when selecting a variation
 *
 * This hook provides a function to create a new form in the database
 * when a user selects a variation from the variation picker.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

interface CreateFormFromVariationOptions {
	variationTitle: string;
}

/**
 * Hook to create a new jetpack-form CPT from a variation selection
 *
 * @return {object} Hook functions and state
 */
export default function useCreateFormFromVariation() {
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	/**
	 * Create a new form in the database
	 *
	 * @param {CreateFormFromVariationOptions} options - Creation options
	 * @return {Promise<number|null>} The created form ID or null on error
	 */
	const createForm = useCallback(
		async ( options: CreateFormFromVariationOptions ): Promise< number | null > => {
			const { variationTitle } = options;

			setIsCreating( true );
			setError( null );

			try {
				const record = await saveEntityRecord( 'postType', 'jetpack-form', {
					title: variationTitle,
					status: 'publish',
					content: '', // Will be populated by block inner blocks via sync
				} );

				setIsCreating( false );

				// Return the created form ID
				return record?.id || null;
			} catch ( err ) {
				const errorMessage =
					( err as Error ).message ||
					__( 'Failed to create form. Please try again.', 'jetpack-forms' );
				setError( errorMessage );
				setIsCreating( false );

				// Log error for debugging
				// eslint-disable-next-line no-console
				console.error( 'Form creation error:', err );

				return null;
			}
		},
		[ saveEntityRecord ]
	);

	return {
		createForm,
		isCreating,
		error,
	};
}
