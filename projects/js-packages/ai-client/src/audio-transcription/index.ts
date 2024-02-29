/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import requestJwt from '../jwt/index.js';

const debug = debugFactory( 'jetpack-ai-client:audio-transcription' );

/**
 * A function that takes an audio blob and transcribes it.
 *
 * @param {Blob} audio - The audio to be transcribed, from a recording or from a file.
 * @param {string} feature - The feature name that is calling the transcription.
 * @param {AbortSignal} requestAbortSignal - The signal to abort the request.
 * @returns {Promise<string>} - The promise of a string containing the transcribed audio.
 */
export default async function transcribeAudio(
	audio: Blob,
	feature?: string,
	requestAbortSignal?: AbortSignal
): Promise< string > {
	debug( 'Transcribing audio: %o. Feature: %o', audio, feature );

	// Get a token to use the transcription service
	let token = '';
	try {
		token = ( await requestJwt() ).token;
	} catch ( error ) {
		debug( 'Error getting token: %o', error );
		return Promise.reject( error );
	}

	// Build a FormData object to hold the audio file
	const formData = new FormData();
	formData.append( 'audio_file', audio );

	try {
		const headers = {
			Authorization: `Bearer ${ token }`,
		};

		const URL = `https://public-api.wordpress.com/wpcom/v2/jetpack-ai-transcription${
			feature ? `?feature=${ feature }` : ''
		}`;

		return fetch( URL, {
			method: 'POST',
			body: formData,
			headers,
			signal: requestAbortSignal ?? undefined,
		} ).then( response => {
			debug( 'Transcription response: %o', response );
			if ( response.ok ) {
				return response.json().then( data => data?.text );
			}
			return response.json().then( data => Promise.reject( data ) );
		} );
	} catch ( error ) {
		debug( 'Transcription error response: %o', error );
		return Promise.reject( error );
	}
}
