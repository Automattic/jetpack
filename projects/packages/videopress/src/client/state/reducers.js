/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
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
	SET_VIDEO_UPLOADING,
	SET_VIDEO_PROCESSING,
	SET_VIDEO_UPLOADED,
	SET_IS_FETCHING_PURCHASES,
	SET_PURCHASES,
	UPDATE_VIDEO_PRIVACY,
	SET_LOCAL_VIDEOS,
	SET_LOCAL_VIDEOS_QUERY,
	SET_LOCAL_VIDEOS_PAGINATION,
	SET_IS_FETCHING_LOCAL_VIDEOS,
	SET_VIDEOS_FILTER,
	UPDATE_VIDEO_POSTER,
	SET_UPDATING_VIDEO_POSTER,
	SET_USERS,
	SET_USERS_PAGINATION,
	SET_LOCAL_VIDEO_UPLOADED,
	SET_IS_FETCHING_PLAYBACK_TOKEN,
	SET_PLAYBACK_TOKEN,
	SET_VIDEO_UPLOAD_PROGRESS,
	EXPIRE_PLAYBACK_TOKEN,
	SET_VIDEOPRESS_SETTINGS,
	DISMISS_FIRST_VIDEO_POPOVER,
	FLUSH_DELETED_VIDEOS,
	UPDATE_PAGINATION_AFTER_DELETE,
	UPDATE_VIDEO_IS_PRIVATE,
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

		case SET_VIDEOS_FILTER: {
			const { filter, value, isActive } = action;
			return {
				...state,
				filter: {
					...state.filter,
					[ filter ]: {
						...( state.filter?.[ filter ] || {} ),
						[ value ]: isActive,
					},
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
			const { video, addAtEnd = false } = action;
			const items = [ ...( state.items ?? [] ) ]; // Clone the array, to avoid mutating the state.
			const videoIndex = items.findIndex( item => item.id === video.id );

			if ( videoIndex === -1 ) {
				// Add video to the list when not found, at the end or at the beginning by default
				addAtEnd ? items.push( video ) : items.unshift( video );
			} else {
				// Update video when found
				items[ videoIndex ] = {
					...items[ videoIndex ],
					...video,
				};
			}

			return {
				...state,
				isFetching: false,
				items,
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

		case UPDATE_VIDEO_IS_PRIVATE: {
			const { id, isPrivate } = action;
			const items = [ ...( state.items ?? [] ) ];
			const videoIndex = items.findIndex( item => item.id === id );

			if ( videoIndex < 0 ) {
				return state;
			}

			// Set isPrivate on video state
			items[ videoIndex ] = {
				...items[ videoIndex ],
				isPrivate,
			};

			return {
				...state,
				items,
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
				// Keep here in case we want to do it in the future.
				// items: [ ...state.items.slice( 0, videoIndex ), ...state.items.slice( videoIndex + 1 ) ],
				_meta: {
					...state._meta,
					videosBeingRemoved: [
						{ id, processed: false, deleted: false },
						...( state._meta.videosBeingRemoved ?? [] ),
					],
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
			const videosBeingRemoved = [ ...( state._meta.videosBeingRemoved ?? [] ) ];
			const removedVideoIndex = videosBeingRemoved.findIndex( item => item.id === id );

			if ( ! _metaVideo || removedVideoIndex < 0 ) {
				return state;
			}

			videosBeingRemoved[ removedVideoIndex ].processed = true;
			videosBeingRemoved[ removedVideoIndex ].deleted = hasBeenDeleted;

			const processedAllVideosBeingRemoved =
				videosBeingRemoved.filter( item => ! item.processed ).length === 0;

			let uploadedVideoCount = state.uploadedVideoCount ?? 0;

			if ( processedAllVideosBeingRemoved ) {
				const videosBeingRemovedCount = videosBeingRemoved.filter( item => item.deleted ).length;
				uploadedVideoCount = uploadedVideoCount - videosBeingRemovedCount;
			}

			return {
				...state,
				uploadedVideoCount,
				_meta: {
					...state._meta,
					videosBeingRemoved,
					processedAllVideosBeingRemoved,
					items: {
						..._metaItems,
						[ id ]: {
							..._metaVideo,
							hasBeenDeleted,
							deletedVideo,
						},
					},
				},
			};
		}

		case FLUSH_DELETED_VIDEOS: {
			return {
				...state,
				_meta: {
					...state._meta,
					videosBeingRemoved: [],
					relyOnInitialState: false,
				},
			};
		}

		/*
		 * Check if query and pagination should change
		 * after deleting video
		 */
		case UPDATE_PAGINATION_AFTER_DELETE: {
			const { items = [], query = {}, pagination = {}, _meta = {} } = state;
			const { videosBeingRemoved = [] } = _meta;
			const videosBeingRemovedCount = videosBeingRemoved.filter( item => item.deleted ).length;

			// If the last videos of the page are deleted, reduce the page by 1
			// Being optimistic here
			const areLastVideos = items?.length === videosBeingRemovedCount;
			const currentPage = query?.page ?? 1;
			const currentTotalPage = pagination?.totalPages ?? 1;
			const currentTotal = pagination?.total;

			const page = areLastVideos && currentPage > 1 ? currentPage - 1 : currentPage;
			const totalPages =
				areLastVideos && currentTotalPage > 1 ? currentTotalPage - 1 : currentTotalPage;

			return {
				...state,
				query: {
					...query,
					page,
				},
				pagination: {
					...pagination,
					total: currentTotal - 1,
					totalPages,
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

		case SET_VIDEO_UPLOADING: {
			const { id, title } = action;
			const currentMeta = state?._meta || {};
			const currentMetaItems = currentMeta?.items || {};
			const sanitizedTitle = cleanForSlug( title );

			return {
				...state,
				_meta: {
					...currentMeta,
					items: {
						...currentMetaItems,
						[ id ]: {
							title: sanitizedTitle,
							uploading: true,
						},
					},
				},
			};
		}

		case SET_VIDEO_PROCESSING: {
			const { id, data } = action;
			const query = state?.query ?? getDefaultQuery();
			const pagination = { ...state.pagination };

			const items = [ ...( state?.items ?? [] ) ];
			const currentMeta = state?._meta || {};
			const currentMetaItems = Object.assign( {}, currentMeta?.items || {} );
			const title =
				data?.src?.split( '/' )?.slice( -1 )?.[ 0 ] || currentMetaItems[ id ]?.title || '';
			const sanitizedTitle = cleanForSlug( title );

			let total = state?.uploadedVideoCount ?? 0;

			let firstUploadedVideoId = state?.firstUploadedVideoId ?? null;
			let firstVideoProcessed = state?.firstVideoProcessed ?? false;
			let dismissedFirstVideoPopover = state?.dismissedFirstVideoPopover ?? false;
			if ( total === 0 ) {
				firstUploadedVideoId = data.id;
				firstVideoProcessed = false;
				dismissedFirstVideoPopover = false;
			}

			// Don't update total and pagination if user is searching or not in the first page.
			if ( query?.page === 1 && ! query?.search ) {
				// Updating pagination and count
				total = ( state?.uploadedVideoCount ?? 0 ) + 1;
				pagination.total = total;
				pagination.totalPages = Math.ceil( total / query?.itemsPerPage );

				// Insert new video
				items.unshift( {
					id: data.id,
					guid: data.guid,
					url: data.src,
					title: sanitizedTitle,
					posterImage: null,
					finished: false,
				} );
			}

			// Remove video from uploading meta
			delete currentMetaItems[ id ];

			return {
				...state,
				items,
				uploadedVideoCount: total,
				firstUploadedVideoId,
				firstVideoProcessed,
				dismissedFirstVideoPopover,
				pagination,
				_meta: {
					...currentMeta,
					items: currentMetaItems,
				},
			};
		}

		case SET_VIDEO_UPLOADED: {
			const { video } = action;
			const items = [ ...( state?.items ?? [] ) ];
			const videoIndex = items.findIndex( item => item.id === video.id );

			const firstUploadedVideoId = state?.firstUploadedVideoId ?? null;
			let firstVideoProcessed = state?.firstVideoProcessed ?? null;
			if ( video.id === firstUploadedVideoId ) {
				firstVideoProcessed = true;
			}

			// Probably user is searching or in another page than first
			if ( videoIndex === -1 ) {
				return {
					...state,
					firstVideoProcessed,
				};
			}

			items[ videoIndex ] = video;

			return {
				...state,
				firstVideoProcessed,
				items,
			};
		}

		case SET_UPDATING_VIDEO_POSTER: {
			const { id } = action;
			const currentMeta = state?._meta || {};
			const currentMetaItems = currentMeta?.items || {};
			const currentVideoMeta = currentMetaItems[ id ] || {};

			return {
				...state,
				_meta: {
					...currentMeta,
					items: {
						...currentMetaItems,
						[ id ]: {
							...currentVideoMeta,
							isUpdatingPoster: true,
						},
					},
				},
			};
		}

		case UPDATE_VIDEO_POSTER: {
			const { id, poster } = action;
			const items = [ ...( state.items ?? [] ) ];
			const currentMeta = state?._meta || {};
			const currentMetaItems = currentMeta?.items || {};
			const videoIndex = items.findIndex( item => item.id === id );

			if ( videoIndex >= 0 ) {
				items[ videoIndex ] = {
					...items[ videoIndex ],
					posterImage: poster,
				};
			}

			return {
				...state,
				items,
				_meta: {
					...currentMeta,
					items: {
						...currentMetaItems,
						[ id ]: {
							isUpdatingPoster: false,
						},
					},
				},
			};
		}

		case SET_VIDEO_UPLOAD_PROGRESS: {
			const { id, bytesSent, bytesTotal } = action;
			const currentMeta = state?._meta || {};
			const currentMetaItems = currentMeta?.items || {};
			const currentVideoMeta = currentMetaItems[ id ] || {};
			const uploadProgress = bytesTotal > 0 ? bytesSent / bytesTotal : 0;

			return {
				...state,
				_meta: {
					...currentMeta,
					items: {
						...currentMetaItems,
						[ id ]: {
							...currentVideoMeta,
							uploadProgress,
						},
					},
				},
			};
		}

		case DISMISS_FIRST_VIDEO_POPOVER: {
			return {
				...state,
				dismissedFirstVideoPopover: true,
				firstUploadedVideoId: null,
			};
		}

		default:
			return state;
	}
};

const localVideos = ( state, action ) => {
	switch ( action.type ) {
		case SET_LOCAL_VIDEOS: {
			const { videos: items } = action;
			return {
				...state,
				items,
				isFetching: false,
			};
		}

		case SET_IS_FETCHING_LOCAL_VIDEOS: {
			return {
				...state,
				isFetching: action.isFetching,
			};
		}

		case SET_LOCAL_VIDEOS_QUERY:
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

		case SET_LOCAL_VIDEOS_PAGINATION: {
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

		case SET_LOCAL_VIDEO_UPLOADED: {
			const { id } = action;
			const items = [ ...( state?.items ?? [] ) ];
			const index = items.findIndex( item => item.id === id );

			if ( index === -1 ) {
				return state;
			}

			items[ index ] = {
				...items[ index ],
				isUploadedToVideoPress: true,
			};

			return {
				...state,
				items,
				isFetching: false,
			};
		}
	}

	return state;
};

const users = ( state, action ) => {
	switch ( action.type ) {
		case SET_USERS: {
			return {
				...state,
				items: action.users,
			};
		}

		case SET_USERS_PAGINATION: {
			return {
				...state,
				pagination: {
					...( state?.pagination || {} ),
					...action.pagination,
				},
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

const playbackTokens = ( state, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_PLAYBACK_TOKEN: {
			return {
				...state,
				isFetching: action.isFetching,
			};
		}

		case SET_PLAYBACK_TOKEN: {
			const { playbackToken } = action;
			const items = [ ...( state.items ?? [] ) ];
			const playbackTokenIndex = items.findIndex( item => item.guid === playbackToken.guid );

			if ( playbackTokenIndex === -1 ) {
				// Add it to the array
				items.unshift( playbackToken );
			} else {
				// Update it
				items[ playbackTokenIndex ] = {
					...items[ playbackTokenIndex ],
					...playbackToken,
				};
			}

			return {
				...state,
				items,
				isFetching: false,
			};
		}

		case EXPIRE_PLAYBACK_TOKEN: {
			const { guid } = action;
			const items = [ ...( state.items ?? [] ) ];
			const playbackTokenIndex = items.findIndex( item => item.guid === guid );

			if ( playbackTokenIndex > -1 ) {
				// Remove it from the array
				items.splice( playbackTokenIndex, 1 );
			}

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

const siteSettings = ( state, action ) => {
	switch ( action.type ) {
		case SET_VIDEOPRESS_SETTINGS: {
			const { videoPressSettings } = action;

			return {
				...state,
				...videoPressSettings,
			};
		}

		default:
			return state;
	}
};

const reducers = combineReducers( {
	videos,
	localVideos,
	purchases,
	users,
	playbackTokens,
	siteSettings,
} );

export default reducers;
