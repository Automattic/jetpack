import { combineReducers } from '@wordpress/data';
import {
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
} from './actions';

const notices = ( state = { global: {} }, action ) => {
	switch ( action.type ) {
		case SET_GLOBAL_NOTICE: {
			const { message, options } = action;
			return {
				...state,
				global: {
					message,
					options,
				},
			};
		}

		case CLEAN_GLOBAL_NOTICE: {
			return {
				...state,
				global: {},
			};
		}

		default:
			return state;
	}
};

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

const lifecycleStats = ( state = {}, action ) => {
	switch ( action.type ) {
		default:
			return state;
	}
};

const reducers = combineReducers( {
	notices,
	plugins,
	statsCounts,
	welcomeBanner,
	lifecycleStats,
} );

export default reducers;
