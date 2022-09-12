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

		payload.set( 'query[orderby]', query.orderBy );
		payload.set( 'query[order]', query.order );
		payload.set( 'query[posts_per_page]', query.itemsPerPage );
		payload.set( 'query[paged]', query.page );
		payload.set( 'query[post_mime_type]', query.type );

		if ( typeof query.search === 'string' && query.search.length > 0 ) {
			payload.set( 'query[s]', query.search );
		}

		dispatch.setIsFetchingVideos( true );

		try {
			const response = await fetch( REST_API_SITE_PURCHASES_ENDPOINT, {
				method: 'POST',
				body: payload,
			} );

			const body = await response.json();
			if ( ! body.success ) {
				return dispatch.setFetchVideosError( body.data );
			}

			dispatch.setVideos( body.data );
			return body.data;
		} catch ( error ) {
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
