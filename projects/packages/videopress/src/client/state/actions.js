/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	SET_IS_FETCHING_VIDEOS,
	SET_VIDEOS_STORAGE_USED,
	SET_VIDEOS,
	SET_VIDEOS_FETCH_ERROR,
	SET_VIDEOS_QUERY,
	SET_VIDEOS_PAGINATION,
	SET_VIDEO,
	DELETE_VIDEO,
	REMOVE_VIDEO,
	SET_IS_FETCHING_UPLOADED_VIDEO_COUNT,
	SET_UPLOADED_VIDEO_COUNT,
	WP_REST_API_VIDEOPRESS_META_ENDPOINT,
	VIDEO_PRIVACY_LEVELS,
	WP_REST_API_MEDIA_ENDPOINT,
} from './constants';

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

const setVideos = videos => {
	return { type: SET_VIDEOS, videos };
};

const setVideo = video => {
	return { type: SET_VIDEO, video };
};

const setIsFetchingUploadedVideoCount = isFetchingUploadedVideoCount => {
	return { type: SET_IS_FETCHING_UPLOADED_VIDEO_COUNT, isFetchingUploadedVideoCount };
};

const setUploadedVideoCount = uploadedVideoCount => {
	return { type: SET_UPLOADED_VIDEO_COUNT, uploadedVideoCount };
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
	// @todo: Add a loading state to the state/UI.
	dispatch.setVideo( {
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

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideosPagination,
	setVideos,
	setVideosStorageUsed,
	setVideo,

	setIsFetchingUploadedVideoCount,
	setUploadedVideoCount,

	updateVideoPrivacy,

	removeVideo,
	deleteVideo,
};

export { actions as default };
