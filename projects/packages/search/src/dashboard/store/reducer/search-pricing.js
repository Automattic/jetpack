import { SET_SEARCH_PRICING } from '../actions/search-pricing';

const sitePricing = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SEARCH_PRICING:
			return {
				...state,
				...action.options,
			};
	}

	return state;
};

export default sitePricing;
