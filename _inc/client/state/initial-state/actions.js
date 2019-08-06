/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';
import { getInitialState } from 'state/initial-state';

export const setInitialState = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: getInitialState(),
		} );
	};
};
