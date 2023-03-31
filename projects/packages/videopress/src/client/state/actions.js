/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { uploadFromLibrary } from '../hooks/use-uploader';
import getMediaToken from '../lib/get-media-token';
import fileUploader from '../lib/resumable-file-uploader';
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
	DISMISS_FIRST_VIDEO_POPOVER,
	SET_UPLOADED_VIDEO_COUNT,
	WP_REST_API_VIDEOPRESS_META_ENDPOINT,
	VIDEO_PRIVACY_LEVELS,
	WP_REST_API_MEDIA_ENDPOINT,
	SET_VIDEO_UPLOADING,
	SET_VIDEO_PROCESSING,
	SET_VIDEO_UPLOADED,
	SET_IS_FETCHING_PURCHASES,
	SET_PURCHASES,
	UPDATE_VIDEO_PRIVACY,
	WP_REST_API_VIDEOPRESS_ENDPOINT,
	UPDATE_VIDEO_POSTER,
	SET_UPDATING_VIDEO_POSTER,
	SET_USERS,
	SET_USERS_PAGINATION,
	SET_LOCAL_VIDEO_UPLOADED,
	SET_IS_FETCHING_PLAYBACK_TOKEN,
	SET_PLAYBACK_TOKEN,
	EXPIRE_PLAYBACK_TOKEN,
	SET_VIDEO_UPLOAD_PROGRESS,
	SET_VIDEOPRESS_SETTINGS,
	WP_REST_API_VIDEOPRESS_SETTINGS_ENDPOINT,
	UPDATE_PAGINATION_AFTER_DELETE,
	FLUSH_DELETED_VIDEOS,
	UPDATE_VIDEO_IS_PRIVATE,
} from './constants';
import { mapVideoFromWPV2MediaEndpoint } from './utils/map-videos';
import { videoIsPrivate } from './utils/video-is-private';

/**
 * Utility function to pool the video data until poster is ready.
 */

const pollingUploadedVideoData = async data => {
	const response = await apiFetch( {
		path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ data?.id }` ),
	} );

	const video = mapVideoFromWPV2MediaEndpoint( response );

	if ( video?.posterImage !== null && video?.posterImage !== '' ) {
		return Promise.resolve( video );
	}

	return new Promise( ( resolve, reject ) => {
		setTimeout( () => {
			pollingUploadedVideoData( data ).then( resolve ).catch( reject );
		}, 2000 );
	} );
};

/**
 * ACTIONS
 */

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

const setVideo = ( video, addAtEnd = false ) => {
	return { type: SET_VIDEO, video, addAtEnd };
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

const updateVideoPrivacy =
	( id, level ) =>
	async ( { dispatch, select, resolveSelect } ) => {
		const privacySetting = Number( level );
		if ( isNaN( privacySetting ) ) {
			throw new Error( `Invalid privacy level: '${ level }'` );
		}

		if ( 0 > privacySetting || privacySetting >= VIDEO_PRIVACY_LEVELS.length ) {
			// @todo: implement error handling / UI
			throw new Error( `Invalid privacy level: '${ level }'` );
		}

		// Request a video token asap when it becomes private.
		if ( level === 1 ) {
			const video = await select.getVideo( id );
			await resolveSelect.getPlaybackToken( video?.guid );
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

			// determine if video is private and update the state for it
			const { videoPressVideosPrivateForSite } = select.getVideoPressSettings();
			dispatch.updateVideoIsPrivate(
				id,
				videoIsPrivate( privacySetting, videoPressVideosPrivateForSite )
			);

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
const deleteVideo =
	id =>
	async ( { dispatch, select } ) => {
		// Let's be optimistic and update the UI right away.
		// @todo: Add a loading state to the state/UI.
		dispatch.removeVideo( id );

		let deleteAction = { type: DELETE_VIDEO, id, hasBeenDeleted: false, video: {} };

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
			if ( resp?.deleted ) {
				deleteAction = { ...deleteAction, hasBeenDeleted: true, video: resp?.previous };
			}
		} catch ( error ) {
			// @todo: implement error handling / UI
			console.error( error ); // eslint-disable-line no-console
		} finally {
			dispatch( deleteAction );
		}

		const processedAllVideosBeingRemoved = select.getProcessedAllVideosBeingRemoved();

		if ( processedAllVideosBeingRemoved ) {
			dispatch( { type: UPDATE_PAGINATION_AFTER_DELETE } );
			dispatch( { type: FLUSH_DELETED_VIDEOS } );
		}
	};

/**
 * Thunk action to upload videos for VideoPress.
 *
 * @param {File} file - File to upload
 * @returns {Function} Thunk action
 */
const uploadVideo =
	file =>
	async ( { dispatch } ) => {
		const tempId = uid();

		// @todo: implement progress and error handler
		const noop = () => {};

		dispatch( { type: SET_VIDEO_UPLOADING, id: tempId, title: file?.name } );

		// @todo: this should be stored in the state
		const tokenData = await getMediaToken( 'upload-jwt' );

		const onSuccess = async data => {
			dispatch( { type: SET_VIDEO_PROCESSING, id: tempId, data } );
			const video = await pollingUploadedVideoData( data );
			dispatch( { type: SET_VIDEO_UPLOADED, video } );
		};

		const onProgress = ( bytesSent, bytesTotal ) => {
			dispatch( { type: SET_VIDEO_UPLOAD_PROGRESS, id: tempId, bytesSent, bytesTotal } );
		};

		fileUploader( {
			tokenData,
			file,
			onError: noop,
			onProgress,
			onSuccess,
		} );
	};

/**
 * Thunk action to upload local videos for VideoPress.
 *
 * @param {object} file - File data
 * @returns {Function} Thunk action
 */
const uploadVideoFromLibrary =
	file =>
	async ( { dispatch } ) => {
		const tempId = uid();
		dispatch( { type: SET_VIDEO_UPLOADING, id: tempId, title: file?.title } );
		const data = await uploadFromLibrary( file?.id );
		dispatch( { type: SET_LOCAL_VIDEO_UPLOADED, id: file?.id } );
		dispatch( { type: SET_VIDEO_PROCESSING, id: tempId, data } );
		const video = await pollingUploadedVideoData( data );
		dispatch( { type: SET_VIDEO_UPLOADED, video } );
	};

const setIsFetchingPurchases = isFetching => {
	return { type: SET_IS_FETCHING_PURCHASES, isFetching };
};

const setPurchases = purchases => {
	return { type: SET_PURCHASES, purchases };
};

const updateVideoPoster =
	( id, guid, data ) =>
	async ( { dispatch, select, resolveSelect } ) => {
		const path = `${ WP_REST_API_VIDEOPRESS_ENDPOINT }/${ guid }/poster`;

		const video = await select.getVideo( id );
		const getPlaybackTokenIfNeeded = async () => {
			if ( ! video.needsPlaybackToken ) {
				return null;
			}

			const playbackToken = await resolveSelect.getPlaybackToken( video.guid );
			return playbackToken?.token;
		};

		const addPlaybackTokenToURLIfNeeded = ( poster, token ) => {
			if ( ! poster || ! token ) {
				return poster;
			}

			return `${ poster }?metadata_token=${ token }`;
		};

		const pollPoster = () => {
			setTimeout( async () => {
				try {
					const resp = await apiFetch( { path, method: 'GET' } );

					if ( resp?.data?.generating ) {
						pollPoster();
					} else {
						const playbackToken = await getPlaybackTokenIfNeeded();
						const poster = resp?.data?.poster;

						dispatch( {
							type: UPDATE_VIDEO_POSTER,
							id,
							poster: addPlaybackTokenToURLIfNeeded( poster, playbackToken ),
						} );
						apiFetch( {
							path: WP_REST_API_VIDEOPRESS_META_ENDPOINT,
							method: 'POST',
							data: {
								id,
								poster,
							},
						} );
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

			/**
			 * For some reason, the thumbnail generator fails when a time
			 * too close to the end of the media is selected. This code is
			 * detecting this scenario and is bringing back the selected frame
			 * to a point where it will succeeed, but close enough to not affect
			 * much the thumbnail itself.
			 */
			const poster_to_duration_threshold = video.duration - data.at_time;
			if ( poster_to_duration_threshold < 50 ) {
				data.at_time -= poster_to_duration_threshold + 50;
			}

			const resp = await apiFetch( { method: 'POST', path, data } );

			if ( resp?.data?.generating ) {
				// Poll the poster image until generated
				pollPoster();
				return;
			}

			const playbackToken = await getPlaybackTokenIfNeeded();
			const poster = addPlaybackTokenToURLIfNeeded( resp?.data?.poster, playbackToken );

			return dispatch( { type: UPDATE_VIDEO_POSTER, id, poster } );
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

const setIsFetchingPlaybackToken = isFetching => {
	return { type: SET_IS_FETCHING_PLAYBACK_TOKEN, isFetching };
};

const setPlaybackToken = playbackToken => {
	return { type: SET_PLAYBACK_TOKEN, playbackToken };
};

const expirePlaybackToken = guid => {
	return { type: EXPIRE_PLAYBACK_TOKEN, guid };
};

const setVideoPressSettings = videoPressSettings => {
	return { type: SET_VIDEOPRESS_SETTINGS, videoPressSettings };
};

/**
 * Thunk action to remove a video from the state,
 *
 * @param {object} settings - VideoPress settings
 * @returns {Function}        Thunk action
 */
const updateVideoPressSettings =
	settings =>
	async ( { dispatch } ) => {
		if ( ! settings ) {
			return;
		}

		const data = { force: true };

		if ( typeof settings.videoPressVideosPrivateForSite === 'boolean' ) {
			data.videopress_videos_private_for_site = settings.videoPressVideosPrivateForSite;
		}

		// videopress_videos_private_for_site
		try {
			// 100% optimistic update
			dispatch.setVideoPressSettings( settings );

			const resp = await apiFetch( {
				path: WP_REST_API_VIDEOPRESS_SETTINGS_ENDPOINT,
				method: 'PUT',
				data,
			} );

			return resp;
		} catch ( error ) {
			// @todo: implement error handling / UI
			console.error( error ); // eslint-disable-line no-console
		}
	};

const updateVideoIsPrivate = ( id, isPrivate ) => {
	return { type: UPDATE_VIDEO_IS_PRIVATE, id, isPrivate };
};

const dismissFirstVideoPopover = () => {
	return { type: DISMISS_FIRST_VIDEO_POPOVER };
};

const actions = {
	setIsFetchingVideos,
	setFetchVideosError,
	setVideosQuery,
	setVideosPagination,
	setVideosFilter,
	setVideos,
	dismissFirstVideoPopover,

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
	uploadVideoFromLibrary,

	setIsFetchingPurchases,
	setPurchases,

	updateVideoPoster,

	setUsers,
	setUsersPagination,

	setIsFetchingPlaybackToken,
	setPlaybackToken,
	expirePlaybackToken,

	setVideoPressSettings,
	updateVideoPressSettings,

	updateVideoIsPrivate,
};

export { actions as default };
