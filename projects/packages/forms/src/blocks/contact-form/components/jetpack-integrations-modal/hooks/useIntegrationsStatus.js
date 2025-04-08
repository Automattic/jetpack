import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Custom hook to fetch and manage all integrations status.
 *
 * @return {object} Object containing integrations data and loading state
 */
export const useIntegrationsStatus = () => {
	const [ status, setStatus ] = useState( {
		isLoading: true,
		integrations: {},
		error: null,
	} );

	const fetchIntegrations = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: '/wp/v2/feedback/integrations',
			} );

			setStatus( {
				isLoading: false,
				integrations: response,
				error: null,
			} );
		} catch ( error ) {
			setStatus( {
				isLoading: false,
				integrations: {},
				error,
			} );
		}
	}, [] );

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
