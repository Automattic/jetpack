import { SET_SEARCH_STATS } from '../actions/site-stats';

const siteStats = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SEARCH_STATS:
			return {
				...state,
				...action.options,
			};
	}

	return state;
};

export default siteStats;
