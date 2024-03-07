import { combineReducers } from '@wordpress/data';
import { SET_STATS_COUNTS_IS_FETCHING, SET_STATS_COUNTS } from './actions';

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

const reducers = combineReducers( {
	plugins,
	statsCounts,
} );

export default reducers;
