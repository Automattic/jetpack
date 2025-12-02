/**
 * Hook to sync form blocks and settings to jetpack_form CPT
 *
 * This hook watches for changes to inner blocks and form settings,
 * then syncs them to the corresponding jetpack_form custom post type.
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
 * Hook to sync form blocks and settings to CPT
 *
 * @param {object} props            - Hook props
 * @param {number} props.formRef    - Form reference ID
 * @param {string} props.clientId   - Block client ID
 * @param {object} props.attributes - Block attributes
 */
export default function useFormSync( { formRef, clientId, attributes }: UseFormSyncProps ): void {
	const previousBlocksRef = useRef< string >( '' );
	const previousSettingsRef = useRef< string >( '' );

	// Get inner blocks
	const innerBlocks = useSelect(
		select => {
			const { getBlocks } = select( blockEditorStore );
			return getBlocks( clientId );
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

	// Sync inner blocks when they change
	useEffect( () => {
		// Don't sync if formRef is not set yet
		if ( ! formRef || formRef === 0 ) {
			return;
		}

		// Serialize current blocks
		const serializedBlocks = serialize( innerBlocks );

		// Only sync if blocks have actually changed
		if ( serializedBlocks !== previousBlocksRef.current ) {
			previousBlocksRef.current = serializedBlocks;
			debouncedSyncBlocks( formRef, serializedBlocks );
		}
	}, [ formRef, innerBlocks, debouncedSyncBlocks ] );

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
