/* globals wp */

wp.apiFetch.use( function( options, next ) {
	var path = options.path;
	var method = options.method;
	var file = options.body ? options.body.get( 'file' ) : null;

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
		.done( function( response ) {
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
		} );

	return next( options );
} );
