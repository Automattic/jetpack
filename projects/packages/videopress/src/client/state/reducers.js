/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS,
	SET_VIDEOS_QUERY,
} from './constants';

/**
 * Retunr default query values
 *
 * @returns {object}       Full query object.
 */
export function getDefaultQuery() {
	return {
		orderBy: 'date',
		order: 'DESC',
		itemsPerPage: 6,
		page: 1,
		type: 'video/videopress',
	};
}

const videos = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_VIDEOS: {
			return {
				...state,
				isFetching: action.isFetching,
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

		case SET_VIDEOS_QUERY: {
			return {
				...state,
				query: {
					...state.query,
					...action.query,
				},
			};
		}

		case SET_VIDEOS: {
			const { videos: items } = action;
			return {
				...state,
				items,
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
