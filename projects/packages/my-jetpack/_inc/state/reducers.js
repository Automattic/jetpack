import { combineReducers } from '@wordpress/data';
import {
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
} from './actions';

const plugins = ( state = {} ) => {
	return state;
};

const statsCounts = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_STATS_COUNTS_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_STATS_COUNTS:
			return {
				...state,
				data: action?.statsCounts || {},
			};

		default:
			return state;
	}
};

const welcomeBanner = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_DISMISSED_WELCOME_BANNER_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_DISMISSED_WELCOME_BANNER:
			return {
				...state,
				hasBeenDismissed: action.hasBeenDismissed,
			};

		default:
			return state;
	}
};

const reducers = combineReducers( {
	plugins,
	statsCounts,
	welcomeBanner,
} );

export default reducers;
