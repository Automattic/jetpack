import apiFetch from '@wordpress/api-fetch';

const usePosterUpload = guid => {
	const videoPressUploadPoster = function ( data ) {
		return new Promise( function ( resolve, reject ) {
			apiFetch( {
				path: `/wpcom/v2/videopress/${ guid }/poster`,
				method: 'POST',
				data,
			} )
				.then( function ( res ) {
					resolve( res );
				} )
				.catch( function ( error ) {
					reject( error );
				} );
		} );
	};

	return videoPressUploadPoster;
};

export default usePosterUpload;
