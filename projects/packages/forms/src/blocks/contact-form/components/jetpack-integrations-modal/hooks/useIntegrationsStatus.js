import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Helper function to determine if an integration is enabled for a form
 *
 * @param {string} key             - Integration key
 * @param {object} integration     - Integration data
 * @param {object} blockAttributes - Block attributes
 * @return {boolean} Whether the integration is enabled for the form
 */
const getIsEnabledForForm = ( key, integration, blockAttributes ) => {
	switch ( key ) {
		case 'akismet':
			return integration.isConnected;
		case 'zero-bs-crm':
			return (
				integration.isActive && integration.details?.hasExtension && blockAttributes.jetpackCRM
			);
		case 'creative-mail-by-constant-contact':
			return integration.isActive && integration.isConnected;
		default:
			return false;
	}
};

/**
 * Custom hook to fetch and manage all integrations status.
 *
 * @param {object|null} blockAttributes - Block attributes when used in block editor context. Determines if isEnabledForForm is calculated.
 * @return {object} Object containing integrations data and loading state
 */
export const useIntegrationsStatus = ( blockAttributes = null ) => {
	const [ status, setStatus ] = useState( {
		isLoading: true,
		integrations: [],
		error: null,
	} );

	const fetchIntegrations = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: addQueryArgs( '/wp/v2/feedback/integrations', {
					version: 2,
				} ),
			} );

			// Transform integrations data
			const integrations = Object.entries( response );
			const integrationsWithEnabled = Object.fromEntries(
				integrations.map( ( [ key, integration ] ) => [
					key,
					{
						...integration,
						...( blockAttributes && {
							isEnabledForForm: getIsEnabledForForm( key, integration, blockAttributes ),
						} ),
					},
				] )
			);

			setStatus( {
				isLoading: false,
				integrations: integrationsWithEnabled,
				error: null,
			} );
		} catch ( error ) {
			setStatus( {
				isLoading: false,
				integrations: [],
				error,
			} );
		}
	}, [ blockAttributes ] );

	// Function to manually refresh the status
	const refreshIntegrations = useCallback( async () => {
		setStatus( current => ( {
			...current,
			isLoading: true,
		} ) );
		await fetchIntegrations();
	}, [ fetchIntegrations ] );

	useEffect( () => {
		fetchIntegrations();
	}, [ fetchIntegrations ] );

	return {
		...status,
		refreshIntegrations,
	};
};
