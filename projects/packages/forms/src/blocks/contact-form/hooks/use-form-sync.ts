/**
 * Hook to sync form blocks and settings to jetpack_form CPT
 *
 * This hook watches for changes to the form block (including wrapper) and form settings,
 * then syncs them to the corresponding jetpack_form custom post type.
 * The entire jetpack/contact-form block is serialized to preserve the wrapper structure.
 * Changes are debounced to avoid excessive API calls.
 */

import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { debounce } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { JetpackContactFormAttributes } from '../edit.tsx';

interface UseFormSyncProps {
	formRef: number;
	clientId: string;
	attributes: JetpackContactFormAttributes;
}

interface SyncBlocksResponse {
	success: boolean;
	message: string;
}

interface SyncSettingsResponse {
	success: boolean;
	message: string;
}

/**
 * Hook to sync form block and settings to CPT
 *
 * @param {object} props            - Hook props
 * @param {number} props.formRef    - Form reference ID
 * @param {string} props.clientId   - Block client ID (the form block wrapper)
 * @param {object} props.attributes - Block attributes
 */
export default function useFormSync( { formRef, clientId, attributes }: UseFormSyncProps ): void {
	const previousBlocksRef = useRef< string >( '' );
	const previousSettingsRef = useRef< string >( '' );

	// Get the entire form block (including wrapper)
	const formBlock = useSelect(
		select => {
			const { getBlock } = select( blockEditorStore );
			return getBlock( clientId );
		},
		[ clientId ]
	);

	// Create debounced sync functions
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSyncBlocks = useCallback(
		debounce( ( formId: number, serializedBlocks: string ) => {
			apiFetch< SyncBlocksResponse >( {
				path: `/jetpack-forms/v1/forms/${ formId }/blocks`,
				method: 'PUT',
				data: {
					blocks: serializedBlocks,
				},
			} ).catch( err => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to sync form blocks:', err );
			} );
		}, 2000 ),
		[]
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSyncSettings = useCallback(
		debounce(
			(
				formId: number,
				settings: Record< string, unknown >,
				integrations: Record< string, unknown >
			) => {
				apiFetch< SyncSettingsResponse >( {
					path: `/jetpack-forms/v1/forms/${ formId }/sync`,
					method: 'PUT',
					data: {
						settings,
						integrations,
					},
				} ).catch( err => {
					// eslint-disable-next-line no-console
					console.error( 'Failed to sync form settings:', err );
				} );
			},
			2000
		),
		[]
	);

	// Sync entire form block (including wrapper) when it changes
	useEffect( () => {
		// Don't sync if formRef is not set yet
		if ( ! formRef || formRef === 0 ) {
			return;
		}

		// Don't sync if formBlock is not loaded yet
		if ( ! formBlock ) {
			return;
		}

		// Serialize the entire form block (including the jetpack/contact-form wrapper)
		const serializedBlocks = serialize( [ formBlock ] );

		// Only sync if blocks have actually changed
		if ( serializedBlocks !== previousBlocksRef.current ) {
			previousBlocksRef.current = serializedBlocks;
			debouncedSyncBlocks( formRef, serializedBlocks );
		}
	}, [ formRef, formBlock, debouncedSyncBlocks ] );

	// Sync settings when they change
	useEffect( () => {
		// Don't sync if formRef is not set yet
		if ( ! formRef || formRef === 0 ) {
			return;
		}

		// Extract settings
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

		// Extract integrations
		const integrations = {
			jetpackCRM: attributes.jetpackCRM || false,
			salesforceData: attributes.salesforceData || { organizationId: '' },
			mailpoet: attributes.mailpoet || { listId: null, listName: null },
			hostingerReach: attributes.hostingerReach || { groupName: '' },
		};

		// Create a serialized version for comparison
		const currentSettings = JSON.stringify( { settings, integrations } );

		// Only sync if settings have actually changed
		if ( currentSettings !== previousSettingsRef.current ) {
			previousSettingsRef.current = currentSettings;
			debouncedSyncSettings( formRef, settings, integrations );
		}
	}, [
		formRef,
		attributes.subject,
		attributes.to,
		attributes.customThankyouHeading,
		attributes.customThankyouMessage,
		attributes.customThankyouRedirect,
		attributes.confirmationType,
		attributes.jetpackCRM,
		attributes.salesforceData,
		attributes.mailpoet,
		attributes.hostingerReach,
		attributes.saveResponses,
		attributes.emailNotifications,
		attributes.disableGoBack,
		attributes.disableSummary,
		attributes.formNotifications,
		attributes.notificationRecipients,
		debouncedSyncSettings,
	] );
}
