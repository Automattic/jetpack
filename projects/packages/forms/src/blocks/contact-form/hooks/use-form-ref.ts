/**
 * Hook to manage jetpack_form CPT reference
 *
 * This hook handles the creation of a jetpack_form custom post type
 * when a new form block is inserted. It ensures every form block
 * has a corresponding CPT to store its data.
 */

import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { JetpackContactFormAttributes } from '../edit.tsx';

interface UseFormRefProps {
	formRef: number;
	setAttributes: ( attributes: { formRef: number } ) => void;
	attributes: JetpackContactFormAttributes;
}

interface CreateFormResponse {
	success: boolean;
	form_id: number;
	message: string;
}

/**
 * Hook to create jetpack_form CPT if formRef is not set
 *
 * @param {object}   props               - Hook props
 * @param {number}   props.formRef       - Current form reference ID
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {object}   props.attributes    - Current block attributes
 * @return {{ isCreating: boolean, error: (string|null) }} Hook state
 */
export default function useFormRef( { formRef, setAttributes, attributes }: UseFormRefProps ): {
	isCreating: boolean;
	error: string | null;
} {
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const hasAttemptedCreation = useRef( false );

	// Get post title for form naming
	const postTitle = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );
		return getEditedPostAttribute( 'title' );
	}, [] );

	useEffect( () => {
		// Only create if:
		// 1. formRef is 0 (not yet created)
		// 2. We haven't already attempted creation
		// 3. We're not currently creating
		if ( formRef !== 0 || hasAttemptedCreation.current || isCreating ) {
			return;
		}

		// Mark that we've attempted creation to prevent duplicate calls
		hasAttemptedCreation.current = true;
		setIsCreating( true );
		setError( null );

		// Extract settings from block attributes
		const settings = {
			subject: attributes.subject || '',
			to: attributes.to || '',
			customThankyouHeading: attributes.customThankyouHeading || '',
			customThankyouMessage: attributes.customThankyouMessage || '',
			customThankyouRedirect: attributes.customThankyouRedirect || '',
			confirmationType: attributes.confirmationType || 'text',
			saveResponses: attributes.saveResponses !== false,
			emailNotifications: attributes.emailNotifications !== false,
			disableGoBack: attributes.disableGoBack || false,
			disableSummary: attributes.disableSummary || false,
			formNotifications: attributes.formNotifications !== false,
			notificationRecipients: attributes.notificationRecipients || [],
		};

		// Extract integrations from block attributes
		const integrations = {
			jetpackCRM: attributes.jetpackCRM || false,
			salesforceData: attributes.salesforceData || { organizationId: '' },
			mailpoet: attributes.mailpoet || { listId: null, listName: null },
			hostingerReach: attributes.hostingerReach || { groupName: '' },
		};

		// Generate form title
		const formTitle =
			attributes.formTitle ||
			( postTitle
				? `${ postTitle } - ${ __( 'Form', 'jetpack-forms' ) }`
				: __( 'New Form', 'jetpack-forms' ) );

		// Create the form via REST API
		apiFetch< CreateFormResponse >( {
			path: '/jetpack-forms/v1/forms/create-from-block',
			method: 'POST',
			data: {
				title: formTitle,
				blocks: '', // Will be synced later by use-form-sync
				settings,
				integrations,
			},
		} )
			.then( response => {
				if ( response.success && response.form_id ) {
					// Update the block with the new form reference
					setAttributes( { formRef: response.form_id } );
					setIsCreating( false );
				} else {
					throw new Error( response.message || __( 'Failed to create form', 'jetpack-forms' ) );
				}
			} )
			.catch( err => {
				const errorMessage =
					err.message || __( 'Failed to create form. Please try again.', 'jetpack-forms' );
				setError( errorMessage );
				setIsCreating( false );
				// Reset the attempt flag so user can retry
				hasAttemptedCreation.current = false;

				// Log error for debugging
				// eslint-disable-next-line no-console
				console.error( 'Form creation error:', err );
			} );
	}, [ formRef, isCreating, postTitle, attributes, setAttributes ] );

	return {
		isCreating,
		error,
	};
}
