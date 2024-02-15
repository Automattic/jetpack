/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import apiFetch from '../api-fetch/index.js';
import requestJwt from '../jwt/index.js';

const debug = debugFactory( 'jetpack-ai-client:audio-transcription' );

/**
 * The response from the audio transcription service.
 */
type AudioTranscriptionResponse = {
	/**
	 * The transcribed text.
	 */
	text: string;
};

/**
 * A function that takes an audio blob and transcribes it.
 *
 * @param {Blob} audio - The audio to be transcribed, from a recording or from a file.
 * @param {string} feature - The feature name that is calling the transcription.
 * @returns {Promise<string>} - The promise of a string containing the transcribed audio.
 */
export default async function transcribeAudio( audio: Blob, feature?: string ): Promise< string > {
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

		const response: AudioTranscriptionResponse = await apiFetch( {
			url: `https://public-api.wordpress.com/wpcom/v2/jetpack-ai-transcription${
				feature ? `?feature=${ feature }` : ''
			}`,
			method: 'POST',
			body: formData,
			headers,
		} );

		debug( 'Transcription response: %o', response );

		return response.text;
	} catch ( error ) {
		debug( 'Transcription error response: %o', error );
		return Promise.reject( error );
	}
}
