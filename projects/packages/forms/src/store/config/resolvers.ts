import apiFetch from '@wordpress/api-fetch';
import { UNKNOWN_ERROR_MESSAGE } from '../constants';
import { INVALIDATE_CONFIG } from './action-types';
import { receiveConfig, setConfigError, setConfigLoading } from './actions';
import type { ConfigAction, ConfigState } from './types';
import type { FormsConfigData } from '../../types';

const fetchConfigData = async ( dispatch: ( action: ConfigAction ) => void ) => {
	dispatch( setConfigLoading( true ) );
	try {
		const result = await apiFetch< FormsConfigData >( {
			path: '/wp/v2/feedback/config',
		} );
		dispatch( receiveConfig( result ) );
	} catch ( e ) {
		const message = e instanceof Error ? e.message : UNKNOWN_ERROR_MESSAGE;
		dispatch( setConfigError( message ) );
	} finally {
		dispatch( setConfigLoading( false ) );
	}
};

/**
 * Resolver to fetch config data.
 *
 * @return {Function} The resolver function.
 */
export function getConfig() {
	return async ( { dispatch }: { dispatch: ( action: ConfigAction ) => void } ) => {
		await fetchConfigData( dispatch );
	};
}

getConfig.isFulfilled = ( state: ConfigState ) => {
	// Consider fulfilled if config exists or is currently loading
	return state.config !== null || state.isLoading;
};

getConfig.shouldInvalidate = ( action: ConfigAction ) => {
	return action.type === INVALIDATE_CONFIG;
};
