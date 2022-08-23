import apiFetch from '@wordpress/api-fetch';

const usePosterImage = guid => {
	const getPosterRequest = ( resolve, reject, jwt = null ) => {
		const url = new URL( 'https://public-api.wordpress.com/rest/v1.1/videos/' + guid + '/poster' );

		if ( jwt && jwt.length ) {
			url.searchParams.append( 'metadata_token', jwt );
		}

		apiFetch( {
			url: url.toString(),
			method: 'GET',
			credentials: 'omit',
		} )
			.then( function ( res ) {
				resolve( res );
			} )
			.catch( function ( error ) {
				reject( error );
			} );
	};

	const videopressGetPoster = () => {
		return new Promise( ( resolve, reject ) => {
			window.wp.ajax
				.post( 'videopress-get-playback-jwt', {
					async: true,
					guid: guid,
				} )
				.done( function ( response ) {
					getPosterRequest( resolve, reject, response.jwt );
				} )
				.fail( () => {
					// Also try on ajax failure if the video doesn't need a jwt anyway
					getPosterRequest( resolve, reject );
				} );
		} );
	};

	return videopressGetPoster;
};

export default usePosterImage;
