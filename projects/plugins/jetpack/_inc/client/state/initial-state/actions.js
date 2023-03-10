import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const setInitialState = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SET_INITIAL_STATE,
			initialState: window.Initial_State,
		} );
	};
};
