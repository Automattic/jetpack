import apiFetch from '@wordpress/api-fetch';

const usePosterImage = guid => {
	const posterImage = () => {
		return new Promise( function ( resolve, reject ) {
			apiFetch( {
				path: `/wpcom/v2/videopress/${ guid }/poster`,
				method: 'GET',
			} )
				.then( function ( res ) {
					resolve( res );
				} )
				.catch( function ( error ) {
					reject( error );
				} );
		} );
	};

	return posterImage;
};

export default usePosterImage;
