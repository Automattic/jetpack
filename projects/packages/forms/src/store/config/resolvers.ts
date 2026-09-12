import apiFetch from '@wordpress/api-fetch';
import { UNKNOWN_ERROR_MESSAGE } from '../constants.ts';
import { INVALIDATE_CONFIG } from './action-types.ts';
import { receiveConfig, setConfigError, setConfigLoading } from './actions.ts';
import type { ConfigAction, ConfigState } from './types.ts';
import type { FormsConfigData } from '../../types/index.ts';

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
	// Counting an in-flight fetch as fulfilled de-duplicates `useSelect` callers, which
	// re-render when the data lands. It also makes `resolveSelect().getConfig()` resolve
	// with a null config instead of waiting, so async callers must treat absent as
	// "unknown" rather than as a value — see routes/forms/route.tsx.
	return state.config !== null || state.isLoading;
};

getConfig.shouldInvalidate = ( action: ConfigAction ) => {
	return action.type === INVALIDATE_CONFIG;
};
