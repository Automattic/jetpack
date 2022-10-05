/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { SET_VIDEOS_QUERY, WP_REST_API_MEDIA_ENDPOINT, DELETE_VIDEO } from './constants';
import { getDefaultQuery } from './reducers';
import { mapVideoFromWPV2MediaEndpoint, mapVideosFromWPV2MediaEndpoint } from './utils/map-videos';

const { apiNonce, apiRoot } = window?.jetpackVideoPressInitialState || {};

const getVideos = {
	isFulfilled: state => {
		return state?.videos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch, select } ) => {
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

		try {
			const response = await fetch(
				addQueryArgs( `${ apiRoot }${ WP_REST_API_MEDIA_ENDPOINT }`, wpv2MediaQuery )
			);

			// pick the pagination data form response header...
			const pagination = {
				total: Number( response.headers.get( 'X-WP-Total' ) ),
				totalPages: Number( response.headers.get( 'X-WP-TotalPages' ) ),
			};

			dispatch.setVideosPagination( pagination );

			// ... and the videos data from the response body.
			const videos = await response.json();

			dispatch.setVideos( mapVideosFromWPV2MediaEndpoint( videos ) );
			return videos;
		} catch ( error ) {
			console.error( error ); // eslint-disable-line no-console
		}
	},
	shouldInvalidate: action => {
		return action.type === SET_VIDEOS_QUERY || action.type === DELETE_VIDEO;
	},
};

const getVideo = {
	isFulfilled: ( state, id ) => {
		if ( ! id ) {
			return true;
		}
		const videos = state.videos.items ?? [];
		return videos?.some( ( { id: videoId } ) => videoId === id );
	},
	fulfill: id => async ( { dispatch } ) => {
		dispatch.setIsFetchingVideos( true );
		try {
			const video = await apiFetch( {
				path: addQueryArgs( `${ WP_REST_API_MEDIA_ENDPOINT }/${ id }` ),
			} );

			dispatch.setVideo( mapVideoFromWPV2MediaEndpoint( video ) );
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
};

const getStorageUsed = {
	isFulfilled: state => {
		return state?.videos?._meta?.relyOnInitialState;
	},

	fulfill: () => async ( { dispatch } ) => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
		try {
			const response = await restApi.fetchSiteData();
			if ( ! response?.options?.videopress_storage_used ) {
				return;
			}

			/*
			 * Storage used in megabytes or null if not found.
			 * Let's compute the value in bytes.
			 */
			const storageUsed = response.options.videopress_storage_used
				? Number( response.options.videopress_storage_used ) * 1024 * 1024
				: 0;

			dispatch.setVideosStorageUsed( storageUsed );
		} catch ( error ) {
			// @todo: handle error
			console.error( error ); // eslint-disable-line no-console
		}
	},
};

export default {
	getStorageUsed,
	getUploadedVideoCount,
	getVideos,
	getVideo,
};
