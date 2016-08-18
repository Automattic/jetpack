/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const setInitialState = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: window.Initial_State
		} );
	}
}

/**
 * Returns a string of the Connect URL used to connect or link an account
 * to WordPress.com
 *
 * @param  {Object}  state  Global state tree
 * @return {string}         Connect URL
 */
export function getConnectUrl( state ) {
	return state.jetpack.initialState.connectUrl;
}

