/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';
/**
 * Types
 */
import type { Integration } from '../../../../../types';

/**
 * Custom hook to fetch and manage a single integration's status.
 *
 * @param {string} slug - The integration slug (e.g., 'google-drive')
 * @return {object} Object containing integration data and loading state
 */
export const useIntegrationStatus = ( slug: string ) => {
	const [ status, setStatus ] = useState< {
		isLoading: boolean;
		integration: Integration | null;
		error: Error | null;
	} >( {
		isLoading: true,
		integration: null,
		error: null,
	} );

	const fetchIntegration = useCallback( async () => {
		if ( ! slug ) {
			setStatus( {
				isLoading: false,
				integration: null,
				error: new Error( 'No integration slug provided.' ),
			} );
			return;
		}

		try {
			const response: Integration = await apiFetch( {
				path: `/wp/v2/feedback/integrations/${ slug }`,
			} );

			setStatus( {
				isLoading: false,
				integration: response,
				error: null,
			} );
		} catch ( error ) {
			setStatus( {
				isLoading: false,
				integration: null,
				error,
			} );
		}
	}, [ slug ] );

	useEffect( () => {
		fetchIntegration();
	}, [ fetchIntegration ] );

	const refreshStatus = useCallback( async () => {
		setStatus( current => ( {
			...current,
			isLoading: true,
		} ) );

		await fetchIntegration();
	}, [ fetchIntegration ] );

	return { ...status, refreshStatus };
};
