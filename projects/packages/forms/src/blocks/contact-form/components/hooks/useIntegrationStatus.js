import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Custom hook to fetch and manage integration status.
 *
 * @param {string} slug - The integration slug (e.g., 'akismet', 'jetpack-crm', 'creative-mail')
 * @return {object} Integration status and loading state
 */
export const useIntegrationStatus = slug => {
	const [ status, setStatus ] = useState( {
		isCheckingStatus: true,
		isInstalled: false,
		isActive: false,
		isConnected: false,
		settingsUrl: '',
		error: null,
	} );

	const checkStatus = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: `/wp/v2/feedback/integrations/${ slug }`,
			} );

			setStatus( {
				isCheckingStatus: false,
				isInstalled: response.isInstalled,
				isActive: response.isActive,
				isConnected: response.isConnected || false,
				settingsUrl: response.settingsUrl || '',
				error: null,
			} );
		} catch ( error ) {
			setStatus( {
				isCheckingStatus: false,
				isInstalled: false,
				isActive: false,
				isConnected: false,
				settingsUrl: '',
				error,
			} );
		}
	}, [ slug ] );

	// Function to manually refresh the status
	const refreshStatus = useCallback( async () => {
		setStatus( current => ( {
			...current,
			isCheckingStatus: true,
		} ) );
		await checkStatus();
	}, [ checkStatus ] );

	useEffect( () => {
		checkStatus();
	}, [ checkStatus ] );

	return {
		...status,
		refreshStatus,
	};
};
