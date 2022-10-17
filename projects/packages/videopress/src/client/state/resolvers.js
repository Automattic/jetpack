/**
 * External dependencies
 */
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
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
	REST_API_SITE_PURCHASES_ENDPOINT,
	REST_API_SITE_INFO_ENDPOINT,
	PROCESSING_VIDEO,
	SET_LOCAL_VIDEOS_QUERY,
	WP_REST_API_USERS_ENDPOINT,
} from './constants';
import { getDefaultQuery } from './reducers';
import {
	mapLocalVideosFromWPV2MediaEndpoint,
	mapVideoFromWPV2MediaEndpoint,
	mapVideosFromWPV2MediaEndpoint,
} from './utils/map-videos';

const { apiRoot } = window?.jetpackVideoPressInitialState || {};

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

			dispatch.setVideos( mapVideosFromWPV2MediaEndpoint( videos ) );
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
		return videos?.some( video => video?.id === id );
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

	shouldInvalidate: action => {
		return action.type === PROCESSING_VIDEO || action.type === DELETE_VIDEO;
	},
};

const getPurchases = {
	fulfill: () => async ( { dispatch, registry } ) => {
		const { currentUser } = registry.select( CONNECTION_STORE_ID ).getUserConnectionData();
		if ( ! currentUser?.isConnected ) {
			return;
		}

		dispatch.setIsFetchingPurchases( true );

		try {
			const purchases = await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } );
			dispatch.setPurchases( purchases );
		} catch ( error ) {
			// @todo: handle error
			console.error( error ); // eslint-disable-line no-console
		}
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
				? Math.round( Number( response.options.videopress_storage_used ) * 1024 * 1024 )
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

export default {
	getStorageUsed,
	getUploadedVideoCount,
	getVideos,
	getVideo,

	getLocalVideos,

	getUsers,

	getPurchases,
};
