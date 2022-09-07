/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT, SET_IS_FETCHING_VIDEOS } from './constants';
import { stateDebug } from '.';

/**
 * Return a full request query object,
 * including the default query parameters.
 *
 * @param {object} query - Query object.
 * @returns {object}       Full query object.
 */
function getFullRequestQuery( query ) {
	return {
		orderBy: 'date',
		order: 'DESC',
		itemsPerPage: 6,
		page: 1,
		type: 'video/videopress',
		...query,
	};
}

const getVideos = {
	isFulfilled: ( state, recentQuery ) => {
		const query = state?.videos.query;
		recentQuery = getFullRequestQuery( recentQuery );
		const isSameQueryRequest = JSON.stringify( query ) === JSON.stringify( recentQuery );
		if ( ! isSameQueryRequest ) {
			stateDebug( 'getVideos: isFulfilled: query mismatch', query, recentQuery );
			return false;
		}

		return true;
	},

	fulfill: ( query = {} ) => async ( { dispatch } ) => {
		const payload = new FormData();
		payload.set( 'action', 'query-attachments' );
		payload.set( 'post_id', 0 );

		const freshQuery = getFullRequestQuery( query );

		payload.set( 'query[orderby]', freshQuery.orderBy );
		payload.set( 'query[order]', freshQuery.order );
		payload.set( 'query[posts_per_page]', freshQuery.itemsPerPage );
		payload.set( 'query[paged]', freshQuery.page );
		payload.set( 'query[post_mime_type]', freshQuery.type );

		dispatch.setIsFetchingVideos( true, freshQuery );

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
		return action.type === SET_IS_FETCHING_VIDEOS;
	},
};

export default {
	getVideos,
};
