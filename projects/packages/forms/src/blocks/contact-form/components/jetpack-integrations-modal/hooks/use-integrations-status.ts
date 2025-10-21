/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import type { Integration, IntegrationMetadata } from '../../../../../types';

type IntegrationsStatusReturn = {
	isLoading: boolean;
	integrations: Integration[];
	error: Error | null;
	refreshIntegrations: () => Promise< void >;
};

/**
 * Custom hook to fetch and manage all integrations status.
 * Uses a two-stage approach:
 * 1. Fetch fast metadata first for immediate UI rendering
 * 2. Fetch full status in background to update with real-time data
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
			// Stage 1: Fetch fast metadata for immediate rendering
			const metadata: IntegrationMetadata[] = await apiFetch( {
				path: '/wp/v2/feedback/integrations-metadata',
			} );

			// Convert to partial Integration objects with default status
			const partialIntegrations: Integration[] = metadata.map( meta => ( {
				...meta,
				pluginFile: null,
				isInstalled: false,
				isActive: false,
				isConnected: false,
				needsConnection: meta.type === 'service',
				version: null,
				settingsUrl: null,
				details: {},
			} ) );

			// Update state immediately with metadata
			setStatus( {
				isLoading: false,
				integrations: partialIntegrations,
				error: null,
			} );

			// Stage 2: Fetch full status in the background
			const fullIntegrations: Integration[] = await apiFetch( {
				path: addQueryArgs( '/wp/v2/feedback/integrations', {
					version: 2,
				} ),
			} );

			// Update with full status data
			setStatus( {
				isLoading: false,
				integrations: fullIntegrations,
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
