import { UNKNOWN_ERROR_MESSAGE } from '../constants.ts';
import {
	RECEIVE_CONFIG,
	RECEIVE_CONFIG_VALUE,
	INVALIDATE_CONFIG,
	SET_CONFIG_LOADING,
	SET_CONFIG_ERROR,
} from './action-types.ts';
import type { ConfigState, ConfigAction } from './types.ts';

const DEFAULT_STATE: ConfigState = {
	config: null,
	isLoading: false,
	error: null,
};

/**
 * Config store reducer.
 *
 * @param state  - Current state
 * @param action - Dispatched action
 * @return Updated state
 */
export default function reducer(
	state: ConfigState = DEFAULT_STATE,
	action: ConfigAction
): ConfigState {
	switch ( action.type ) {
		case SET_CONFIG_LOADING:
			return {
				...state,
				isLoading: !! action.isLoading,
				error: action.isLoading ? null : state.error,
			};
		case SET_CONFIG_ERROR:
			return {
				...state,
				isLoading: false,
				error: action.error ?? UNKNOWN_ERROR_MESSAGE,
			};
		case RECEIVE_CONFIG:
			return {
				...state,
				config: action.config ?? null,
				isLoading: false,
				error: null,
			};
		case RECEIVE_CONFIG_VALUE:
			return {
				...state,
				config: {
					...( state.config ?? {} ),
					[ action.key as string ]: action.value,
				},
			};
		case INVALIDATE_CONFIG:
			return {
				...state,
				config: null,
				isLoading: false,
			};
		default:
			return state;
	}
}
