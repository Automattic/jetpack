/**
 * Hook to load form data when switching between forms
 *
 * This hook handles fetching form data from the jetpack_form CPT
 * and updating the block attributes and inner blocks accordingly.
 */

import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';

interface FormData {
	id: number;
	title: {
		rendered: string;
	};
	content: {
		rendered: string;
	};
	meta: {
		_jetpack_form_settings?: string;
		_jetpack_form_integrations?: string;
	};
}

interface FormSettings {
	subject?: string;
	to?: string;
	customThankyouHeading?: string;
	customThankyouMessage?: string;
	customThankyouRedirect?: string;
	confirmationType?: 'text' | 'redirect';
	saveResponses?: boolean;
	emailNotifications?: boolean;
	disableGoBack?: boolean;
	disableSummary?: boolean;
	formNotifications?: boolean;
	notificationRecipients?: number[];
}

interface FormIntegrations {
	jetpackCRM?: boolean;
	salesforceData?: Record< string, unknown >;
	mailpoet?: Record< string, unknown >;
	hostingerReach?: Record< string, unknown >;
}

interface UseFormLoaderProps {
	clientId: string;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
}

interface UseFormLoaderReturn {
	loadForm: ( formId: number ) => Promise< void >;
	isLoading: boolean;
	error: string | null;
}

/**
 * Hook to load form data from CPT and update block
 *
 * @param {string}   clientId      - Block client ID
 * @param {Function} setAttributes - Function to update block attributes
 * @return {object} Hook state with loadForm function, loading state, and error
 */
export default function useFormLoader( {
	clientId,
	setAttributes,
}: UseFormLoaderProps ): UseFormLoaderReturn {
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const loadForm = useCallback(
		async ( formId: number ) => {
			if ( ! formId || formId === 0 ) {
				return;
			}

			setIsLoading( true );
			setError( null );

			try {
				// Fetch the form post data
				const formData = await apiFetch< FormData >( {
					path: `/wp/v2/jetpack-forms/${ formId }`,
				} );

				// Parse settings from meta
				let settings: FormSettings = {};
				if ( formData.meta._jetpack_form_settings ) {
					try {
						settings = JSON.parse( formData.meta._jetpack_form_settings );
					} catch ( e ) {
						console.error( 'Failed to parse form settings:', e );
					}
				}

				// Parse integrations from meta
				let integrations: FormIntegrations = {};
				if ( formData.meta._jetpack_form_integrations ) {
					try {
						integrations = JSON.parse( formData.meta._jetpack_form_integrations );
					} catch ( e ) {
						console.error( 'Failed to parse form integrations:', e );
					}
				}

				// Parse blocks from post content
				const blocks = parse( formData.content.rendered || '' );

				// Update block attributes with form settings and integrations
				setAttributes( {
					formRef: formId,
					formTitle: formData.title.rendered,
					...settings,
					...integrations,
				} );

				// Replace inner blocks with form blocks
				replaceInnerBlocks( clientId, blocks, false );

				setIsLoading( false );
			} catch ( err: unknown ) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to load form. Please try again.';
				setError( errorMessage );
				setIsLoading( false );
				console.error( 'Form loading error:', err );
			}
		},
		[ clientId, setAttributes, replaceInnerBlocks ]
	);

	return {
		loadForm,
		isLoading,
		error,
	};
}
