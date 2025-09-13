/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { Integration } from '../../../../../types';

type IntegrationsStatusReturn = {
	isLoading: boolean;
	integrations: Integration[];
	error: Error | null;
	refreshIntegrations: () => Promise< void >;
};

/**
 * Custom hook to fetch and manage all integrations status.
 *
 * @return {object} Object containing integrations data and loading state
 */
export const useIntegrationsStatus = (): IntegrationsStatusReturn => {
	const [ status, setStatus ] = useState< {
		isLoading: boolean;
		integrations: Integration[];
		error: Error | null;
	} >( {
		isLoading: true,
		integrations: [],
		error: null,
	} );

	const fetchIntegrations = useCallback( async () => {
		try {
			const response: Integration[] = await apiFetch( {
				path: addQueryArgs( '/wp/v2/feedback/integrations', {
					version: 2,
				} ),
			} );

			setStatus( {
				isLoading: false,
				integrations: response,
				error: null,
			} );
		} catch ( error ) {
			setStatus( {
				isLoading: false,
				integrations: [],
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
