/**
 * Internal dependencies
 */
import { REST_API_SITE_PURCHASES_ENDPOINT } from './constants';

const getVideos = {
	isFulfilled: state => {
		return !! state?.videos?.items;
	},
	fulfill: () => async ( { dispatch } ) => {
		const payload = new FormData();
		payload.set( 'action', 'query-attachments' );
		payload.set( 'post_id', 0 );

		payload.set( 'query[orderby]', 'date' );
		payload.set( 'query[order]', 'DESC' );
		payload.set( 'query[posts_per_page]', 6 );
		payload.set( 'query[paged]', 1 );
		payload.set( 'query[mime_type]', 'video/' );

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

			dispatch.fetchVideos( body.data );
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
