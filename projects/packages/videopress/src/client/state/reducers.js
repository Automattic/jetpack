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
	SET_VIDEOS_PAGINATION,
	SET_VIDEO,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
	SET_VIDEOS_STORAGE_USED,
	REMOVE_VIDEO,
} from './constants';

/**
 * Retunr default query values
 *
 * @returns {object}       Full query object.
 */
export function getDefaultQuery() {
	return {
		order: 'desc',
		orderBy: 'date',
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

		case SET_VIDEOS_PAGINATION: {
			return {
				...state,
				pagination: {
					...state.pagination,
					...action.pagination,
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

		case SET_VIDEO: {
			const { video } = action;
			const { query = getDefaultQuery() } = state;
			const items = [ ...( state.items ?? [] ) ]; // Clone the array, to avoid mutating the state.
			const videoIndex = items.findIndex( item => item.id === video.id );

			let uploadedVideoCount = state.uploadedVideoCount;
			const pagination = { ...state.pagination };

			if ( videoIndex === -1 ) {
				// Add video when not found at beginning of the list.
				items.unshift( video );
				// Updating pagination and count
				uploadedVideoCount += 1;
				pagination.total += 1;
				pagination.totalPages = Math.ceil( pagination.total / query?.itemsPerPage );
			} else {
				// Update video when found
				items[ videoIndex ] = {
					...items[ videoIndex ],
					...video,
				};
			}

			return {
				...state,
				items,
				isFetching: false,
				uploadedVideoCount,
				pagination,
			};
		}

		case REMOVE_VIDEO: {
			const { id } = action;
			const { items = [] } = state;
			const videoIndex = items.findIndex( item => item.id === id );

			if ( videoIndex < 0 ) {
				return state;
			}

			return {
				...state,
				items: [ ...state.items.slice( 0, videoIndex ), ...state.items.slice( videoIndex + 1 ) ],
			};
		}

		case SET_VIDEOS_STORAGE_USED: {
			return {
				...state,
				storageUsed: action.used,
			};
		}

		case SET_IS_FETCHING_UPLOADED_VIDEO_COUNT: {
			return {
				...state,
				isFetchingUploadedVideoCount: action.isFetchingUploadedVideoCount,
			};
		}

		case SET_UPLOADED_VIDEO_COUNT: {
			return {
				...state,
				uploadedVideoCount: action.uploadedVideoCount,
				isFetchingUploadedVideoCount: false,
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
