/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

const getVideos = {
	isFulfilled: state => {
		return !! state?.videos?.items;
	},

	fulfill: ( query = {} ) => async ( { dispatch } ) => {
		const payload = new FormData();
		payload.set( 'action', 'query-attachments' );
		payload.set( 'post_id', 0 );

		payload.set( 'query[orderby]', query.orderBy || 'date' );
		payload.set( 'query[order]', query.order || 'DESC' );
		payload.set( 'query[posts_per_page]', query.perPage || 6 );
		payload.set( 'query[paged]', query.page || 1 );
		payload.set( 'query[post_mime_type]', query.type || 'video/videopress' );

		try {
			dispatch.setIsFetchingVideos();

			const response = await fetch( REST_API_SITE_PURCHASES_ENDPOINT, {
				method: 'POST',
				body: payload,
			} );

			const body = await response.json();
			if ( ! body.success ) {
				return dispatch.setFetchVideosError( body.data );
			}

			dispatch.setVideos( body.data );
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
