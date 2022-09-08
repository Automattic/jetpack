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
		order: 'desc',
		itemsPerPage: 6,
		page: 1,
		type: 'video/videopress',
	};
}

/**
 * Map the data from the `/wp/v2/mediq` response body,
 * to the data expected by the components
 *
 * @param {Array} data - The response body
 * @returns {Array}      The mapped data
 */
function mapItemFromWPv2MediaResponseBody( data ) {
	if ( ! data?.length ) {
		return [];
	}

	return data.map( item => {
		return {
			poster: '',
			id: item.id,
			title: item.title?.rendered,
			posterImage: '',
			uploadDate: '',
			duration: '',
			plays: '',
			isPrivate: '',
			image: '',
		};
	} );
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
				items: mapItemFromWPv2MediaResponseBody( items ),
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
