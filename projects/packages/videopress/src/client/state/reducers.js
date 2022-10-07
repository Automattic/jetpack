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
	SET_VIDEO_PRIVACY,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
	SET_VIDEOS_STORAGE_USED,
	REMOVE_VIDEO,
	DELETE_VIDEO,
	SET_IS_FETCHING_PURCHASES,
	SET_PURCHASES,
	UPDATE_VIDEO_PRIVACY,
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

const videos = ( state, action ) => {
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
				_meta: {
					...state._meta,
					relyOnInitialState: false,
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
				_meta: {
					...state._meta,
					relyOnInitialState: false,
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

		case SET_VIDEO_PRIVACY: {
			const { id, privacySetting } = action;
			const items = [ ...( state.items ?? [] ) ];
			const videoIndex = items.findIndex( item => item.id === id );

			if ( videoIndex < 0 ) {
				return state;
			}

			// current -> previous value of privacy
			const current = items[ videoIndex ].privacySetting;

			// Set privacy setting straigh in the state. Let's be optimistic.
			items[ videoIndex ] = {
				...items[ videoIndex ],
				privacySetting,
			};

			// Set metadata about the privacy change.
			const _metaItems = { ...( state._meta?.items ?? [] ) };
			const _metaVideo = _metaItems[ id ] ?? {};

			return {
				...state,
				items,
				_meta: {
					...state._meta,
					items: {
						..._metaItems,
						[ id ]: {
							..._metaVideo,
							isUpdatingPrivacy: true,
							hasBeenUpdatedPrivacy: false,
							prevPrivacySetting: current,
						},
					},
				},
			};
		}

		case UPDATE_VIDEO_PRIVACY: {
			const { id } = action;

			const _metaItems = { ...( state._meta?.items ?? [] ) };
			if ( ! _metaItems?.[ id ] ) {
				return state;
			}

			const _metaVideo = _metaItems[ id ] ?? {};

			return {
				...state,
				_meta: {
					...state._meta,
					items: {
						..._metaItems,
						[ id ]: {
							..._metaVideo,
							isUpdatingPrivacy: false,
							hasBeenUpdatedPrivacy: true,
							prevPrivacySetting: null,
						},
					},
				},
			};
		}

		/*
		 * REMOVE_VIDEO is the action trigger
		 * right after the user tries to remove the video,
		 * for instance, when the user clicks on the "Remove" button.
		 * Use it as an oportunity to update the UI and show a loading state,
		 * while the video is being removed.
		 */
		case REMOVE_VIDEO: {
			const { id } = action;
			const { items = [] } = state;
			const videoIndex = items.findIndex( item => item.id === id );

			if ( videoIndex < 0 ) {
				return state;
			}

			const _metaItems = {
				...( state._meta?.items ?? [] ),
			};

			const _metaVideo = _metaItems[ id ] ?? {};

			return {
				...state,
				// Do not remove the video from the list, just update the meta data.
				// Keep here in caswe we want to do it in the future.
				// items: [ ...state.items.slice( 0, videoIndex ), ...state.items.slice( videoIndex + 1 ) ],
				_meta: {
					...state._meta,
					items: {
						..._metaItems,
						[ id ]: {
							..._metaVideo,
							isDeleting: true,
						},
					},
				},
			};
		}

		/*
		 * DELETE_VIDEO is the action trigger
		 * right after the video is removed from the server,
		 */
		case DELETE_VIDEO: {
			const { id, hasBeenDeleted, video: deletedVideo } = action;
			const _metaItems = state?._meta?.items || [];
			const _metaVideo = _metaItems[ id ] || {};
			const uploadedVideoCount = state.uploadedVideoCount - 1;

			if ( ! _metaVideo ) {
				return state;
			}

			return {
				...state,
				uploadedVideoCount,
				_meta: {
					...state._meta,
					relyOnInitialState: false,
					items: {
						..._metaItems,
						[ id ]: {
							..._metaVideo,
							isDeleting: false,
							hasBeenDeleted,
							deletedVideo,
						},
					},
				},
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

const purchases = ( state, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_PURCHASES: {
			return {
				...state,
				isFetching: action.isFetching,
			};
		}

		case SET_PURCHASES: {
			return {
				...state,
				items: action.purchases,
				isFetching: false,
			};
		}

		default:
			return state;
	}
};

const reducers = combineReducers( {
	videos,
	purchases,
} );

export default reducers;
