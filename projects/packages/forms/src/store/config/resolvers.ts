import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { INVALIDATE_CONFIG } from './action-types';
import { receiveConfig, setConfigError, setConfigLoading } from './actions';
import type { ConfigAction, ConfigState } from './types';
import type { FormsConfigData } from '../../types';

// Track if a fetch is in progress to prevent duplicate requests
let fetchPromise: Promise< void > | null = null;

const fetchConfigData = async ( dispatch: ( action: ConfigAction ) => void ) => {
	// If already fetching, return the existing promise
	if ( fetchPromise ) {
		return fetchPromise;
	}

	fetchPromise = ( async () => {
		dispatch( setConfigLoading( true ) );
		try {
			const result = await apiFetch< FormsConfigData >( {
				path: '/wp/v2/feedback/config',
			} );
			dispatch( receiveConfig( result ) );
		} catch ( e ) {
			const message = e instanceof Error ? e.message : __( 'Unknown error', 'jetpack-forms' );
			dispatch( setConfigError( message ) );
		} finally {
			dispatch( setConfigLoading( false ) );
			fetchPromise = null;
		}
	} )();

	return fetchPromise;
};

// Reset fetch tracking when config is invalidated
const resetFetchTracking = () => {
	fetchPromise = null;
};
export const getConfig = {
	fulfill:
		() =>
		async ( { dispatch }: { dispatch: ( action: ConfigAction ) => void } ) => {
			await fetchConfigData( dispatch );
		},
	isFulfilled: ( state: ConfigState ) => {
		// Consider fulfilled if:
		// 1. Config exists
		// 2. Currently loading (isLoading state is set)
		// 3. A fetch promise is in progress (prevents race conditions in isFulfilled checks)
		return state.config !== null || state.isLoading || fetchPromise !== null;
	},
	shouldInvalidate: ( action: ConfigAction ) => {
		if ( action.type === INVALIDATE_CONFIG ) {
			resetFetchTracking();
			return true;
		}
		return false;
	},
};
