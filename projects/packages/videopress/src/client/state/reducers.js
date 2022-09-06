/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { SET_IS_FETCHING_VIDEOS, SET_VIDEOS_FETCH_ERROR, SET_VIDEOS } from './constants';

const videos = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_VIDEOS: {
			const { isFetching, query } = action;
			return {
				...state,
				isFetching,
				query: query,
			};
		}

		case SET_VIDEOS_FETCH_ERROR: {
			const { error } = action;
			return {
				...state,
				isFetching: false,
				error,
			};
		}

		case SET_VIDEOS: {
			const { videos: items, query } = action;
			return {
				...state,
				items: {
					...state.items,
					...items,
				},
				isFetching: false,
				query,
			};
		}

		default:
			return state;
	}
};

const reducers = combineReducers( {
	videos,
} );

export default reducers;
