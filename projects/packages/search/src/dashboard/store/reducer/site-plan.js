import { SET_SEARCH_PLAN_INFO } from '../actions/site-plan';

const sitePlan = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SEARCH_PLAN_INFO:
			// Replace rather than merge, so nothing from the plan seeded at page load outlives a fresh one.
			return { ...action.options };
	}

	return state;
};

export default sitePlan;
