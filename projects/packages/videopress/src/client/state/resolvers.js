/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { SET_VIDEOS_QUERY, WP_REST_API_MEDIA_ENDPOINT } from './constants';
import { getDefaultQuery } from './reducers';
import { mapVideosFromWPV2MediaEndpoint } from './utils/map-videos';

const { apiRoot } = window.jetpackVideoPressInitialState;

const getVideos = {
	fulfill: () => async ( { dispatch, select } ) => {
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

		dispatch.setIsFetchingVideos( true );

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
			dispatch.setFetchVideosError( error );
		}
	},
	shouldInvalidate: action => {
		return action.type === SET_VIDEOS_QUERY;
	},
};

const getVideo = {
	fulfill: () => async ( { resolveSelect } ) => {
		// We make sure that videos are fullfiled.
		// This is used when user comes from Media Library.
		await resolveSelect.getVideos();
	},
};

export default {
	getVideos,
	getVideo,
};
