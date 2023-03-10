import { combineReducers } from 'redux';
import { SET_PLAN_DURATION } from 'state/action-types';

const selectedPlanDuration = ( initialState = 'yearly', action ) => {
	switch ( action.type ) {
		case SET_PLAN_DURATION:
			return action.duration;

		default:
			return initialState;
	}
};

export const reducer = combineReducers( {
	duration: selectedPlanDuration,
} );

/**
 * Determines if the DevCard should be displayed.
 * @param  {Object}  state Global state tree
 * @return {Boolean}       whether the devCard can be displayed
 */
export function getPlanDuration( state ) {
	return state.jetpack.plans.duration;
}
