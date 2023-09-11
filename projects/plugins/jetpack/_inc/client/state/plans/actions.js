import { SET_PLAN_DURATION } from 'state/action-types';

export const setPlanDuration = duration => {
	return dispatch => {
		dispatch( {
			type: SET_PLAN_DURATION,
			duration,
		} );
	};
};
