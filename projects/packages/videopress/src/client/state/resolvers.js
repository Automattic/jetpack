/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { SET_VIDEOS_QUERY, WP_REST_API_MEDIA_ENDPOINT } from './constants';
import { getDefaultQuery } from './reducers';
import { mapVideosFromWPV2MediaEndpoint } from './utils/map-videos';

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
			const videosList = await apiFetch( {
				path: addQueryArgs( WP_REST_API_MEDIA_ENDPOINT, wpv2MediaQuery ),
			} );

			dispatch.setVideos( mapVideosFromWPV2MediaEndpoint( videosList ) );
			return videosList;
		} catch ( error ) {
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
