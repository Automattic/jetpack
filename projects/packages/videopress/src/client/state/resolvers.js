/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

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

		return JSON.stringify( query ) === JSON.stringify( recentQuery );
	},

	fulfill: ( query = {} ) => async ( { dispatch } ) => {
		const payload = new FormData();
		payload.set( 'action', 'query-attachments' );
		payload.set( 'post_id', 0 );

		const reqQuery = getFullRequestQuery( query );

		payload.set( 'query[orderby]', reqQuery.orderBy );
		payload.set( 'query[order]', reqQuery.order );
		payload.set( 'query[posts_per_page]', reqQuery.itemsPerPage );
		payload.set( 'query[paged]', reqQuery.page );
		payload.set( 'query[post_mime_type]', reqQuery.type );

		try {
			dispatch.setIsFetchingVideos( reqQuery );

			const response = await fetch( REST_API_SITE_PURCHASES_ENDPOINT, {
				method: 'POST',
				body: payload,
			} );

			const body = await response.json();
			if ( ! body.success ) {
				return dispatch.setFetchVideosError( body.data );
			}

			dispatch.setVideos( body.data, reqQuery );
			return Promise.resolve();
		} catch ( error ) {
			dispatch.setFetchVideosError( error );
			return Promise.resolve();
		}
	},
};

export default {
	getVideos,
};
