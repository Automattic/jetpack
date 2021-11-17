/**
 * Internal dependencies
 */
import { SET_SEARCH_PLAN_INFO } from '../actions/site-plan';

const sitePlan = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SEARCH_PLAN_INFO:
			return {
				...state,
				...action.options,
			};
	}

	return state;
};

export default sitePlan;
