/**
 * Internal dependencies
 */
import {
	ActionTypes as InitialStateActionTypes
} from '@automattic/jetpack-initial-state';
const { JETPACK_SET_INITIAL_STATE } = InitialStateActionTypes;

export const setInitialState = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: window.Initial_State,
		} );
	};
};
