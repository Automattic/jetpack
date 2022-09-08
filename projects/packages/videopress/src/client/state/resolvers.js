/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT, SET_VIDEOS_QUERY } from './constants';
import { getDefaultQuery } from './reducers';

const getVideos = {
	fulfill: () => async ( { dispatch, select } ) => {
		const payload = new FormData();
		payload.set( 'action', 'query-attachments' );
		payload.set( 'post_id', 0 );

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

		dispatch.setIsFetchingVideos( true );

		try {
			const response = await apiFetch( {
				path: addQueryArgs( REST_API_SITE_PURCHASES_ENDPOINT, {
					media_type: 'video',
					orderby: query.orderBy,
					order: query.order,
					mime_type: query.type,
					page: query.page,
					per_page: query.itemsPerPage,
				} ),
			} );

			dispatch.setVideos( response );
		} catch ( error ) {
			console.error( 'error: ', error ); // eslint-disable-line no-console
			dispatch.setFetchVideosError( error );
		}
	},
	shouldInvalidate: action => {
		return action.type === SET_VIDEOS_QUERY;
	},
};

export default {
	getVideos,
};
