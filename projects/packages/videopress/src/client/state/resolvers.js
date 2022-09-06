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

		const reqQuery = {
			orderBy: 'date',
			order: 'DESC',
			itemsPerPage: 6,
			page: 1,
			type: 'video/videopress',
			...query,
		};

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
