/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import {
	SET_VIDEOS_QUERY,
	SET_VIDEOS_FILTER,
	WP_REST_API_MEDIA_ENDPOINT,
	DELETE_VIDEO,
	REST_API_SITE_INFO_ENDPOINT,
	PROCESSING_VIDEO,
	SET_LOCAL_VIDEOS_QUERY,
	WP_REST_API_USERS_ENDPOINT,
	WP_REST_API_VIDEOPRESS_PLAYBACK_TOKEN_ENDPOINT,
	EXPIRE_PLAYBACK_TOKEN,
	WP_REST_API_VIDEOPRESS_SETTINGS_ENDPOINT,
} from './constants';
import { getDefaultQuery } from './reducers';
import {
	mapLocalVideosFromWPV2MediaEndpoint,
	mapVideoFromWPV2MediaEndpoint,
	mapVideosFromWPV2MediaEndpoint,
} from './utils/map-videos';

const { apiRoot } = window?.jetpackVideoPressInitialState || {};

/**
 * Helper function to populate some video data
 * that requires a token.
 *
 * @param {object} video         - Video object.
 * @param {object} resolveSelect - Containing the store’s selectors pre-bound to state
 * @param {object} dispatch      - Containing the store’s actions pre-bound to state
 * @returns {object}               Tokenized video data object.
 */
async function populateVideoDataWithToken( video, resolveSelect, dispatch ) {
	if ( ! video.needsPlaybackToken ) {
		return video;
	}

	let playbackToken = await resolveSelect.getPlaybackToken( video.guid );

	if ( playbackToken ) {
		// let's set the expire time to 24h
		const playbackTokenExpireTime = Number( playbackToken.issueTime ) + 1000 * 60 * 60 * 24;
		if ( playbackTokenExpireTime < Date.now() ) {
			// expire the old one
			await dispatch.expirePlaybackToken( video.guid );
			// and get a new one
			playbackToken = await resolveSelect.getPlaybackToken( video.guid );
		}
	}

	if ( ! /metadata_token=/.test( video.posterImage ) ) {
		video.posterImage += `?metadata_token=${ playbackToken.token }`;
	}

	if ( ! /metadata_token=/.test( video.thumbnail ) ) {
		video.thumbnail += `?metadata_token=${ playbackToken.token }`;
	}

	if ( ! /metadata_token=/.test( video.url ) ) {
		video.url += `?metadata_token=${ playbackToken.token }`;
	}

	return video;
}

const getVideos = {
	isFulfilled: state => {
		return state?.videos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch, select, resolveSelect } ) => {
		dispatch.setIsFetchingVideos( true );

		let query = select.getVideosQuery();

		/*
		 * If there is no query:
		 * - set the default query (dispatch)
		 * - and use it to fetch the videos.
		 */
		if ( ! query ) {
			query = getDefaultQuery();
			dispatch.setVideosQuery( query );
		}

		// Map query to the format expected by the API.
		const wpv2MediaQuery = {
			order: query.order,
			orderby: query.orderBy,
			page: query.page,
			per_page: query.itemsPerPage,
			media_type: 'video',
			mime_type: 'video/videopress',
		};

		if ( typeof query.search === 'string' && query.search.length > 0 ) {
			wpv2MediaQuery.search = query.search;
		}

		const filter = select.getVideosFilter();

		// Filter -> Rating
		const videoPressRatingFilter = Object.keys( filter?.rating || {} )
			.filter( key => filter.rating[ key ] )
			.join( ',' );

		if ( videoPressRatingFilter?.length ) {
			wpv2MediaQuery.videopress_rating = videoPressRatingFilter;
		}

		// Filter -> Privacy
		const videoPressPrivacyFilter = Object.keys( filter?.privacy || {} )
			.filter( key => filter.privacy[ key ] )
			.join( ',' );

		if ( videoPressPrivacyFilter?.length ) {
			wpv2MediaQuery.videopress_privacy_setting = videoPressPrivacyFilter;
		}

		// Filter -> Uploader
		const videoPressUploaderFilter = Object.keys( filter?.uploader || {} )
			.filter( key => filter.uploader[ key ] )
			.join( ',' );

		if ( videoPressUploaderFilter?.length ) {
			wpv2MediaQuery.author = videoPressUploaderFilter;
		}

		try {
			const response = await fetch(
				addQueryArgs( `${ apiRoot }${ WP_REST_API_MEDIA_ENDPOINT }`, wpv2MediaQuery )
			);

			// pick the pagination data form response header...
			const total = Number( response.headers.get( 'X-WP-Total' ) );
			const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) );

			// Update pagination and total uploaded videos count.
			dispatch.setVideosPagination( { total, totalPages } );

			// ... and the videos data from the response body.
			const videos = await response.json();

			/*
			 * Map videos from the API to the format expected by the app,
			 * and tokenize some data when the video is private.
			 */
			const mappedVideos = await Promise.all(
				mapVideosFromWPV2MediaEndpoint( videos ).map( async video => {
					return await populateVideoDataWithToken( video, resolveSelect, dispatch );
				} )
			);

			dispatch.setVideos( mappedVideos );
			return videos;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
	shouldInvalidate: ( { type } ) => {
		return type === SET_VIDEOS_QUERY || type === DELETE_VIDEO || type === SET_VIDEOS_FILTER;
	},
};

const getVideo = {
	isFulfilled: ( state, id ) => {
		// String ID is the generated ID, not the WP ID.
		if ( ! id || typeof id === 'string' ) {
			return true;
		}

		const videos = state.videos.items ?? [];
		const video = videos.find( ( { id: videoId } ) => videoId === id );

		// Private videos require a token to be fetched.
		if ( video && video.needsPlaybackToken ) {
			const tokens = state?.playbackTokens?.items || [];
			const token = tokens.find( t => t?.guid === video.guid );

			return !! token;
		}

		return video;
	},
	fulfill: id => async ( { dispatch, resolveSelect } ) => {
		dispatch.setIsFetchingVideos( true );

		try {
			const video = await apiFetch( {
				path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ id }` ),
			} );
			const mappedVideoData = await populateVideoDataWithToken(
				mapVideoFromWPV2MediaEndpoint( video ),
				resolveSelect,
				dispatch
			);

			dispatch.setVideo( mappedVideoData );
			return video;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
};

const getUploadedVideoCount = {
	isFulfilled: state => {
		return state?.videos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch } ) => {
		// Only the minimum necessary data
		const wpv2MediaQuery = {
			per_page: 1,
			media_type: 'video',
			mime_type: 'video/videopress',
		};

		dispatch.setIsFetchingUploadedVideoCount( true );

		try {
			const response = await fetch(
				addQueryArgs( `${ apiRoot }${ WP_REST_API_MEDIA_ENDPOINT }`, wpv2MediaQuery )
			);

			const total = Number( response.headers.get( 'X-WP-Total' ) );

			dispatch.setUploadedVideoCount( total );

			return total;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},

	shouldInvalidate: action => {
		return action.type === PROCESSING_VIDEO || action.type === DELETE_VIDEO;
	},
};

const getStorageUsed = {
	isFulfilled: state => {
		return state?.videos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch } ) => {
		try {
			const response = await apiFetch( { path: REST_API_SITE_INFO_ENDPOINT } );
			if ( ! response?.options?.videopress_storage_used ) {
				return;
			}

			/*
			 * Storage used in megabytes or null if not found.
			 * Let's compute the value in bytes.
			 */
			const storageUsed = response.options.videopress_storage_used
				? Math.round( Number( response.options.videopress_storage_used ) * 1000 * 1000 )
				: 0;

			dispatch.setVideosStorageUsed( storageUsed );
		} catch ( error ) {
			// @todo: handle error
			console.error( error ); // eslint-disable-line no-console
		}
	},
};

const getLocalVideos = {
	isFulfilled: state => {
		return state?.localVideos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch, select } ) => {
		let query = select.getLocalVideosQuery();
		dispatch.setIsFetchingLocalVideos( true );

		/*
		 * If there is no query:
		 * - set the default query (dispatch)
		 * - and use it to fetch the videos.
		 */
		if ( ! query ) {
			query = getDefaultQuery();
			dispatch.setVideosQuery( query );
		}

		// Map query to the format expected by the API.
		const wpv2MediaQuery = {
			order: query.order,
			orderby: query.orderBy,
			page: query.page,
			per_page: query.itemsPerPage,
			media_type: 'video',
			no_videopress: true,
		};

		if ( typeof query.search === 'string' && query.search.length > 0 ) {
			wpv2MediaQuery.search = query.search;
		}

		try {
			const response = await fetch(
				addQueryArgs( `${ apiRoot }${ WP_REST_API_MEDIA_ENDPOINT }`, wpv2MediaQuery )
			);

			const total = Number( response.headers.get( 'X-WP-Total' ) );
			const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) );

			dispatch.setLocalVideosPagination( { total, totalPages } );

			const localVideos = await response.json();
			dispatch.setLocalVideos( mapLocalVideosFromWPV2MediaEndpoint( localVideos ) );
			return localVideos;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
	shouldInvalidate: action => {
		return action.type === SET_LOCAL_VIDEOS_QUERY;
	},
};

const getUsers = {
	isFulfilled: state => {
		return state?.users?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch } ) => {
		dispatch.setIsFetchingLocalVideos( true );

		try {
			const response = await fetch( `${ apiRoot }${ WP_REST_API_USERS_ENDPOINT }` );

			const total = Number( response.headers.get( 'X-WP-Total' ) );
			const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) );
			dispatch.setUsersPagination( { total, totalPages } );

			const users = await response.json();
			if ( ! users?.length ) {
				return;
			}
			dispatch.setUsers(
				users.map( user => {
					return {
						id: user.id,
						name: user.name,
						slug: user.slug,
						description: user.description,
						link: user.link,
						avatar: user.avatar_urls,
					};
				} )
			);
			return users;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
};

const getPlaybackToken = {
	isFulfilled: ( state, guid ) => {
		const playbackTokens = state?.playbackTokens?.items ?? [];
		return playbackTokens?.some( token => token?.guid === guid );
	},
	fulfill: guid => async ( { dispatch } ) => {
		dispatch.setIsFetchingPlaybackToken( true );

		try {
			const playbackTokenResponse = await apiFetch( {
				path: addQueryArgs( `${ WP_REST_API_VIDEOPRESS_PLAYBACK_TOKEN_ENDPOINT }/${ guid }` ),
				method: 'POST',
			} );

			const playbackToken = {
				guid,
				token: playbackTokenResponse.playback_token,
				issueTime: Date.now(),
			};

			dispatch.setPlaybackToken( playbackToken );

			return playbackToken;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
	shouldInvalidate: ( action, guid ) => {
		return action.type === EXPIRE_PLAYBACK_TOKEN && action.guid === guid;
	},
};

const getVideoPressSettings = {
	isFulfilled: state => {
		return state?.siteSettings !== undefined;
	},
	fulfill: () => async ( { dispatch } ) => {
		try {
			const { videopress_videos_private_for_site: videoPressVideosPrivateForSite } = await apiFetch(
				{
					path: addQueryArgs( `${ WP_REST_API_VIDEOPRESS_SETTINGS_ENDPOINT }` ),
					method: 'GET',
				}
			);

			const videoPressSettings = { videoPressVideosPrivateForSite };

			dispatch.setVideoPressSettings( videoPressSettings );
			return videoPressSettings;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
};

export default {
	getStorageUsed,
	getUploadedVideoCount,
	getVideos,
	getVideo,

	getLocalVideos,

	getUsers,

	getPlaybackToken,

	getVideoPressSettings,
};
