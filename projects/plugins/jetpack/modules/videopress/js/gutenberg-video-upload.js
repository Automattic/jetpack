/* globals wp, lodash */

wp.apiFetch.use( function ( options, next ) {
	var path = options.path;
	var method = options.method;
	var body = options.body;
	var file = body ? body.get( 'file' ) : null;

	// Override only requests to the WP REST API media endpoint uploading new videos.
	if ( ! path || path.indexOf( '/wp/v2/media' ) === -1 ) {
		return next( options );
	}
	if ( ! method || 'post' !== method.toLowerCase() ) {
		return next( options );
	}
	if ( ! file || file.type.indexOf( 'video/' ) !== 0 ) {
		return next( options );
	}

	// Get upload token.
	wp.media
		.ajax( 'videopress-get-upload-token', { async: false, data: { filename: file.name } } )
		.done( function ( response ) {
			// Set auth header with upload token.
			var headers = options.headers || {};
			headers.Authorization =
				'X_UPLOAD_TOKEN token="' +
				response.upload_token +
				'" blog_id="' +
				response.upload_blog_id +
				'"';
			options.headers = headers;

			// Replace upload URL.
			delete options.path;
			options.url = response.upload_action_url;

			// Handle CORS.
			options.credentials = 'omit';

			// Set data in expected param by WP.com media endpoint.
			body.set( 'media[]', file );
			body.delete( 'file' );
			options.body = body;
		} );

	var result = next( options );

	return new Promise( function ( resolve, reject ) {
		result
			.then( function ( data ) {
				var wpcomMediaObject = lodash.get( data, 'media[0]' );
				var id = lodash.get( wpcomMediaObject, 'ID' );
				var gutenbergMediaObject = wp.apiFetch( {
					path: '/wp/v2/media/' + id,
				} );
				resolve( gutenbergMediaObject );
			} )
			.catch( function () {
				reject();
			} );
	} );
} );
