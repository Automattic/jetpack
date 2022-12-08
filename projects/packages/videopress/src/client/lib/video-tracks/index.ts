/**
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import getMediaToken from '../get-media-token';
import { DeleteTrackDataProps, UploadTrackDataProps } from './types';

export const TRACK_KIND_OPTIONS = [
	'subtitles',
	'captions',
	'descriptions',
	'chapters',
	'metadata',
] as const;

const shouldUseJetpackVideoFetch = () => ! ( isSimpleSite() || isAtomicSite() );

const videoPressUploadTrack = function ( track: UploadTrackDataProps, guid: string ) {
	return new Promise( function ( resolve, reject ) {
		const { kind, srcLang, label, tmpFile: vttFile } = track;

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
				method: 'POST',
				body,
			};

			fetch( `https://public-api.wordpress.com/rest/v1.1/videos/${ guid }/tracks`, requestOptions )
				.then( data => {
					try {
						return resolve( data.json() );
					} catch ( error ) {
						return reject( error );
					}
				} )
				.catch( reject );
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
export const uploadTrackForGuid = ( track: UploadTrackDataProps, guid: string ) => {
	const { kind, srcLang, label, tmpFile } = track;

	if ( shouldUseJetpackVideoFetch() ) {
		return videoPressUploadTrack( { kind, srcLang, label, tmpFile }, guid );
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

const videoPressDeleteTrack = function ( { kind, srcLang }, guid ) {
	// eslint-disable-next-line no-undef
	return new Promise( function ( resolve, reject ) {
		getMediaToken( 'upload' ).then( ( { token, blogId } ) => {
			const body = new FormData();
			body.append( 'kind', kind );
			body.append( 'srclang', srcLang );

			const requestOptions = {
				headers: {
					// Set auth header with upload token.
					Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
				},
				method: 'POST',
				body,
			};

			fetch(
				`https://public-api.wordpress.com/rest/v1.1/videos/${ guid }/tracks/delete`,
				requestOptions
			)
				.then( data => {
					try {
						return resolve( data.json() );
					} catch ( error ) {
						return reject( error );
					}
				} )
				.catch( reject );
		} );
	} );
};

/**
 * -Deletes a track from a video.
 * -Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid - the video guid
 * @returns {Promise} the api request promise
 */
export const deleteTrackForGuid = ( track: DeleteTrackDataProps, guid: string ) => {
	const { kind, srcLang } = track;

	if ( shouldUseJetpackVideoFetch() ) {
		return videoPressDeleteTrack( { kind, srcLang }, guid );
	}

	const options = {
		method: 'POST',
		path: `/videos/${ guid }/tracks/delete`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', kind ],
			[ 'srclang', srcLang ],
		],
	};

	return apiFetch( options );
};
