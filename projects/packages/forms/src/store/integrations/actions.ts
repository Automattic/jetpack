import {
	RECEIVE_INTEGRATIONS,
	INVALIDATE_INTEGRATIONS,
	SET_INTEGRATIONS_LOADING,
	SET_INTEGRATIONS_ERROR,
} from './action-types';
import { getIntegrations } from './resolvers';
import type { Integration } from '../../types';

export const receiveIntegrations = ( items: Integration[] ) => ( {
	type: RECEIVE_INTEGRATIONS,
	items,
} );

export const invalidateIntegrations = () => ( {
	type: INVALIDATE_INTEGRATIONS,
} );

export const setIntegrationsLoading = ( isLoading: boolean ) => ( {
	type: SET_INTEGRATIONS_LOADING,
	isLoading,
} );

export const setIntegrationsError = ( error: string | null ) => ( {
	type: SET_INTEGRATIONS_ERROR,
	error,
} );

// Thunk-like action to immediately refresh from the endpoint
export const refreshIntegrations = () => getIntegrations();
