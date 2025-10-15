import {
	RECEIVE_CONFIG,
	RECEIVE_CONFIG_VALUE,
	INVALIDATE_CONFIG,
	SET_CONFIG_LOADING,
	SET_CONFIG_ERROR,
} from './action-types';
import { getConfig } from './resolvers';
import type { FormsConfigData } from '../../types';

export const receiveConfig = ( config: Partial< FormsConfigData > ) => ( {
	type: RECEIVE_CONFIG,
	config,
} );

export const receiveConfigValue = < K extends keyof FormsConfigData >(
	key: K,
	value: FormsConfigData[ K ]
) => ( {
	type: RECEIVE_CONFIG_VALUE,
	key,
	value,
} );

export const invalidateConfig = () => ( {
	type: INVALIDATE_CONFIG,
} );

export const setConfigLoading = ( isLoading: boolean ) => ( {
	type: SET_CONFIG_LOADING,
	isLoading,
} );

export const setConfigError = ( error: string | null ) => ( {
	type: SET_CONFIG_ERROR,
	error,
} );

// Thunk-like action to immediately refresh from the endpoint
export const refreshConfig = () => getConfig();
