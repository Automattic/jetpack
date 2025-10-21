import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { UNKNOWN_ERROR_MESSAGE } from '../constants';
import { INVALIDATE_INTEGRATIONS } from './action-types';
import { receiveIntegrations, setIntegrationsError, setIntegrationsLoading } from './actions';
import type { IntegrationsAction } from './types';
import type { Integration, IntegrationMetadata } from '../../types';

/**
 * Fetches integrations with a two-stage approach for optimal performance:
 * 1. First, fetch fast metadata (preloaded) to render UI immediately
 * 2. Then, fetch full status to update with real-time data
 *
 * This prevents jank and ensures the dashboard loads quickly.
 *
 * @return {Function} Thunk function that dispatches integration actions
 */
export const getIntegrations =
	() =>
	async ( { dispatch }: { dispatch: ( action: IntegrationsAction ) => void } ) => {
		dispatch( setIntegrationsLoading( true ) );
		try {
			// Stage 1: Fetch fast metadata (this will be served from preload cache)
			const metadataPath = '/wp/v2/feedback/integrations-metadata';
			const metadata = await apiFetch< IntegrationMetadata[] >( { path: metadataPath } );

			// Convert metadata to partial Integration objects with default status values
			// This allows the UI to render immediately with names/descriptions
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

			// Dispatch partial data immediately for fast UI rendering
			dispatch( receiveIntegrations( partialIntegrations ) );

			// Stage 2: Fetch full status in the background
			// This call may be slower (checks /me/connections) but UI is already rendered
			const fullPath = addQueryArgs( '/wp/v2/feedback/integrations', { version: 2 } );
			const fullIntegrations = await apiFetch< Integration[] >( { path: fullPath } );

			// Update with full data including real status
			dispatch( receiveIntegrations( fullIntegrations ) );
		} catch ( e ) {
			const message = e instanceof Error ? e.message : UNKNOWN_ERROR_MESSAGE;
			dispatch( setIntegrationsError( message ) );
		} finally {
			dispatch( setIntegrationsLoading( false ) );
		}
	};

// Attach invalidation rule
getIntegrations.shouldInvalidate = ( action: IntegrationsAction ) =>
	action.type === INVALIDATE_INTEGRATIONS;
