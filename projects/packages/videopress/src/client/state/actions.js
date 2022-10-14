/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { uploadVideo as videoPressUpload, getJWT } from '../hooks/use-uploader';
import uid from '../utils/uid';
import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS_STORAGE_USED,
	SET_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS_QUERY,
	SET_VIDEOS_PAGINATION,
	SET_VIDEOS_FILTER,
	SET_LOCAL_VIDEOS,
	SET_IS_FETCHING_LOCAL_VIDEOS,
	SET_LOCAL_VIDEOS_QUERY,
	SET_LOCAL_VIDEOS_PAGINATION,
	SET_VIDEO,
	SET_VIDEO_PRIVACY,
	DELETE_VIDEO,
	REMOVE_VIDEO,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
	WP_REST_API_VIDEOPRESS_META_ENDPOINT,
	VIDEO_PRIVACY_LEVELS,
	WP_REST_API_MEDIA_ENDPOINT,
	UPLOADING_VIDEO,
	PROCESSING_VIDEO,
	UPLOADED_VIDEO,
	SET_IS_FETCHING_PURCHASES,
	SET_PURCHASES,
	UPDATE_VIDEO_PRIVACY,
	WP_REST_API_VIDEOPRESS_ENDPOINT,
	UPDATE_VIDEO_POSTER,
	SET_UPDATING_VIDEO_POSTER,
	SET_USERS,
	SET_USERS_PAGINATION,
} from './constants';
import { mapVideoFromWPV2MediaEndpoint } from './utils/map-videos';

const setIsFetchingVideos = isFetching => {
	return { type: SET_IS_FETCHING_VIDEOS, isFetching };
};

const setFetchVideosError = error => ( {
	type: SET_VIDEOS_FETCH_ERROR,
	error,
} );

const setVideosQuery = query => {
	return { type: SET_VIDEOS_QUERY, query };
};

const setVideosPagination = pagination => {
	return { type: SET_VIDEOS_PAGINATION, pagination };
};

const setVideosFilter = ( filter, value, isActive ) => {
	return { type: SET_VIDEOS_FILTER, filter, value, isActive };
};

const setVideos = videos => {
	return { type: SET_VIDEOS, videos };
};

const setVideo = video => {
	return { type: SET_VIDEO, video };
};

const setVideoPrivacy = ( { id, privacySetting } ) => {
	return { type: SET_VIDEO_PRIVACY, id, privacySetting };
};

const setIsFetchingUploadedVideoCount = isFetchingUploadedVideoCount => {
	return { type: SET_IS_FETCHING_UPLOADED_VIDEO_COUNT, isFetchingUploadedVideoCount };
};

const setUploadedVideoCount = uploadedVideoCount => {
	return { type: SET_UPLOADED_VIDEO_COUNT, uploadedVideoCount };
};

const setLocalVideos = videos => {
	return { type: SET_LOCAL_VIDEOS, videos };
};

const setIsFetchingLocalVideos = isFetching => {
	return { type: SET_IS_FETCHING_LOCAL_VIDEOS, isFetching };
};

const setLocalVideosQuery = query => {
	return { type: SET_LOCAL_VIDEOS_QUERY, query };
};

const setLocalVideosPagination = pagination => {
	return { type: SET_LOCAL_VIDEOS_PAGINATION, pagination };
};

const setVideosStorageUsed = used => {
	return { type: SET_VIDEOS_STORAGE_USED, used };
};

const updateVideoPrivacy = ( id, level ) => async ( { dispatch } ) => {
	const privacySetting = Number( level );
	if ( isNaN( privacySetting ) ) {
		throw new Error( `Invalid privacy level: '${ level }'` );
	}

	if ( 0 > privacySetting || privacySetting >= VIDEO_PRIVACY_LEVELS.length ) {
		// @todo: implement error handling / UI
		throw new Error( `Invalid privacy level: '${ level }'` );
	}

	// Let's be optimistic and update the UI right away.
	dispatch.setVideoPrivacy( {
		id,
		privacySetting,
	} );

	try {
		const resp = await apiFetch( {
			path: WP_REST_API_VIDEOPRESS_META_ENDPOINT,
			method: 'POST',
			data: {
				id,
				privacy_setting: privacySetting,
			},
		} );

		if ( resp?.data !== 200 ) {
			// Here, we expect data to be 200
			// @todo: implement error handling / UI
			return;
		}

		return dispatch( { type: UPDATE_VIDEO_PRIVACY, id, privacySetting } );
	} catch ( error ) {
		// @todo: implement error handling / UI
		console.error( error ); // eslint-disable-line no-console
	}
};

/**
 * Regular action to remove a video from the state,
 * used as a primary hint for the UI to update.
 *
 * @param {string|number} id - Video post ID
 * @returns {object} Action object
 */
const removeVideo = id => {
	return { type: REMOVE_VIDEO, id };
};

/**
 * Thunk action to remove a video from the state,
 *
 * @param {string|number} id - Video post ID
 * @returns {Function} Thunk action
 */
const deleteVideo = id => async ( { dispatch } ) => {
	// Let's be optimistic and update the UI right away.
	// @todo: Add a loading state to the state/UI.
	dispatch.removeVideo( id );

	try {
		const resp = await apiFetch( {
			path: `${ WP_REST_API_MEDIA_ENDPOINT }/${ id }`,
			method: 'DELETE',
			data: {
				id,
				force: true,
			},
		} );

		// dispach action to invalidate the cache
		if ( ! resp?.deleted ) {
			return dispatch( { type: DELETE_VIDEO, id, hasBeenDeleted: false, video: {} } );
		}
		dispatch( { type: DELETE_VIDEO, id, hasBeenDeleted: true, video: resp?.previous } );
	} catch ( error ) {
		// @todo: implement error handling / UI
		console.error( error ); // eslint-disable-line no-console
	}
};

/**
 * Thunk action to fetch upload videos for VideoPress.
 *
 * @param {File} file - File to upload
 * @returns {Function} Thunk action
 */
const uploadVideo = file => async ( { dispatch } ) => {
	const tempId = uid();

	const pollingUploadedVideoData = async data => {
		const response = await apiFetch( {
			path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ data?.id }` ),
		} );

		const video = mapVideoFromWPV2MediaEndpoint( response );

		if ( video?.posterImage !== null ) {
			dispatch( { type: UPLOADED_VIDEO, video } );
		} else {
			setTimeout( () => pollingUploadedVideoData( video ), 2000 );
		}
	};

	// @todo: implement progress and error handler
	const noop = () => {};

	dispatch( { type: UPLOADING_VIDEO, id: tempId, title: file?.name } );

	// @todo: this should be stored in the state
	const jwt = await getJWT();

	videoPressUpload( {
		data: jwt,
		file,
		onError: noop,
		onProgress: noop,
		onSuccess: data => {
			dispatch( { type: PROCESSING_VIDEO, id: tempId, data } );
			pollingUploadedVideoData( data );
		},
	} );
};

const setIsFetchingPurchases = isFetching => {
	return { type: SET_IS_FETCHING_PURCHASES, isFetching };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const updateVideoPoster = ( id, guid, data ) => async ( { dispatch } ) => {
	const path = `${ WP_REST_API_VIDEOPRESS_ENDPOINT }/${ guid }/poster`;

	const pollPoster = () => {
		setTimeout( async () => {
			try {
				const resp = await apiFetch( { path, method: 'GET' } );

				if ( resp?.data?.generating ) {
					pollPoster();
				} else {
					dispatch( { type: UPDATE_VIDEO_POSTER, id, poster: resp?.data?.poster } );
				}
			} catch ( error ) {
				// @todo implement error handling / UI
				// eslint-disable-next-line no-console
				console.error( error );
			}
		}, 2000 );
	};

	try {
		dispatch( { type: SET_UPDATING_VIDEO_POSTER, id } );

		const resp = await apiFetch( { method: 'POST', path, data } );

		if ( resp?.data?.generating ) {
			// Poll the poster image until generated
			pollPoster();
			return;
		}

		return dispatch( { type: UPDATE_VIDEO_POSTER, id, poster: resp?.data?.poster } );
	} catch ( error ) {
		// @todo: implement error handling / UI
		console.error( error ); // eslint-disable-line no-console
	}
};

const setUsers = users => {
	return { type: SET_USERS, users };
};

const setUsersPagination = pagination => {
	return { type: SET_USERS_PAGINATION, pagination };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideosPagination,
	setVideosFilter,
	setVideos,

	setLocalVideos,
	setIsFetchingLocalVideos,
	setLocalVideosQuery,
	setLocalVideosPagination,

	setVideosStorageUsed,
	setVideo,

	setIsFetchingUploadedVideoCount,
	setUploadedVideoCount,

	setVideoPrivacy,
	updateVideoPrivacy,

	removeVideo,
	deleteVideo,

	uploadVideo,
	setIsFetchingPurchases,
	setPurchases,

	updateVideoPoster,

	setUsers,
	setUsersPagination,
};

export { actions as default };
