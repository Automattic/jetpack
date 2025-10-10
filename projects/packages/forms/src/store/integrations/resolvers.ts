import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { INVALIDATE_INTEGRATIONS } from './action-types';
import { receiveIntegrations, setIntegrationsError, setIntegrationsLoading } from './actions';
import type { IntegrationsAction } from './types';
import type { Integration } from '../../types';

export const getIntegrations =
	() =>
	async ( { dispatch }: { dispatch: ( action: IntegrationsAction ) => void } ) => {
		dispatch( setIntegrationsLoading( true ) );
		try {
			const path = addQueryArgs( '/wp/v2/feedback/integrations', { version: 2 } );
			const result = await apiFetch< Integration[] >( { path } );
			dispatch( receiveIntegrations( result ) );
		} catch ( e ) {
			const message = e instanceof Error ? e.message : __( 'Unknown error', 'jetpack-forms' );
			dispatch( setIntegrationsError( message ) );
		} finally {
			dispatch( setIntegrationsLoading( false ) );
		}
	};

// Attach invalidation rule
getIntegrations.shouldInvalidate = ( action: IntegrationsAction ) =>
	action.type === INVALIDATE_INTEGRATIONS;
