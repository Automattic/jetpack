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
			return {
				...state,
				isFetching: true,
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
			const { videos: videosList } = action;
			return {
				...state,
				items: videosList,
				isFetching: false,
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
