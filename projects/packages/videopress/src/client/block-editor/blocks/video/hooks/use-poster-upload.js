import apiFetch from '@wordpress/api-fetch';

const usePosterUpload = guid => {
	const videoPressUploadPoster = function ( data ) {
		return new Promise( function ( resolve, reject ) {
			window.wp.media
				.ajax( 'videopress-get-upload-token', { async: true } )
				.done( function ( response ) {
					// Set auth header with upload token.
					const headers = {},
						options = {};
					const body = new FormData();
					headers.Authorization =
						'X_UPLOAD_TOKEN token="' +
						response.upload_token +
						'" blog_id="' +
						response.upload_blog_id +
						'"';
					options.headers = headers;
					options.method = 'POST';
					options.url = 'https://public-api.wordpress.com/rest/v1.1/videos/' + guid + '/poster';

					// Handle CORS.
					options.credentials = 'omit';

					Object.keys( data ).forEach( key => {
						body.append( key, data[ key ] );
					} );

					options.body = body;
					apiFetch( options )
						.then( function ( res ) {
							resolve( res );
						} )
						.catch( function ( error ) {
							reject( error );
						} );
				} );
		} );
	};

	return videoPressUploadPoster;
};

export default usePosterUpload;
