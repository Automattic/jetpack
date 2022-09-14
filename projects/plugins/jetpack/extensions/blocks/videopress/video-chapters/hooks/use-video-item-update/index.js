/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default function useMediaItemUpdate( id ) {
	const updateMediaItem = data => {
		return new Promise( ( resolve, reject ) => {
			const apiData = { id, ...data };

			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: apiData,
			} )
				.then( result => {
					if ( 200 !== result?.data ) {
						return reject( result );
					}
					resolve( result );
				} )
				.catch( reject );
		} );
	};

	return updateMediaItem;
}
