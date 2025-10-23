import { UNKNOWN_ERROR_MESSAGE } from '../constants';
import {
	RECEIVE_INTEGRATIONS,
	INVALIDATE_INTEGRATIONS,
	SET_INTEGRATIONS_LOADING,
	SET_INTEGRATIONS_ERROR,
} from './action-types';
import type { IntegrationsState, IntegrationsAction } from './types';

const DEFAULT_STATE: IntegrationsState = {
	items: null,
	isLoading: false,
	error: null,
};

/**
 * Integrations store reducer.
 *
 * @param state  - Current state
 * @param action - Dispatched action
 * @return Updated state
 */
export default function reducer(
	state: IntegrationsState = DEFAULT_STATE,
	action: IntegrationsAction
): IntegrationsState {
	switch ( action.type ) {
		case SET_INTEGRATIONS_LOADING:
			return {
				...state,
				isLoading: !! action.isLoading,
				error: action.isLoading ? null : state.error,
			};
		case SET_INTEGRATIONS_ERROR:
			return {
				...state,
				isLoading: false,
				error: action.error ?? UNKNOWN_ERROR_MESSAGE,
			};
		case RECEIVE_INTEGRATIONS:
			return {
				...state,
				items: action.items,
				isLoading: false,
				error: null,
			};
		case INVALIDATE_INTEGRATIONS:
			return {
				...state,
				items: null,
				isLoading: false,
			};
		default:
			return state;
	}
}
