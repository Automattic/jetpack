/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../../../lib/get-media-token';

const shouldUseJetpackVideoFetch = () => {
	return window.siteType !== 'simple';
};

const videoPressUploadTrack = function ( guid, kind, srcLang, label, vttFile ) {
	return new Promise( function ( resolve, reject ) {
		getMediaToken( 'upload' ).then( ( { token, blogId } ) => {
			const body = new FormData();
			body.append( 'kind', kind );
			body.append( 'srclang', srcLang );
			body.append( 'label', label );
			body.append( 'vtt', vttFile );

			const requestOptions = {
				headers: {
					// Set auth header with upload token.
					Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
				},
				credentials: 'omit', // Handle CORS.
				url: `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }/tracks`,
				method: 'POST',
				body,
			};

			apiFetch( requestOptions ).then( resolve ).catch( reject );
		} );
	} );
};

/**
 * Uploads a track to a video.
 * Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid - the video guid
 * @returns {Promise} the api request promise
 */
export const uploadTrackForGuid = ( track = {}, guid ) => {
	const { kind, srcLang, label, tmpFile } = track;

	if ( shouldUseJetpackVideoFetch() ) {
		return videoPressUploadTrack( guid, kind, srcLang, label, tmpFile );
	}

	return apiFetch( {
		method: 'POST',
		path: `/videos/${ guid }/tracks`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', kind ],
			[ 'srclang', srcLang ],
			[ 'label', label ],
			[ 'vtt', tmpFile ],
		],
	} );
};
