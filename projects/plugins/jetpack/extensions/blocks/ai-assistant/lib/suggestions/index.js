/**
 * External dependencies
 */
import { requestJwt, SuggestionsEventSource } from '@automattic/jetpack-ai-client';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant' );

/**
 *
 * askJetpack exists just for debugging purposes
 *
 * @param {string} question - The query to send to the API
 * @returns {string} The event source
 */
export async function askJetpack( question ) {
	let source;
	try {
		source = await askQuestion( question );
	} catch ( err ) {
		debug( 'Error', err );
		return source;
	}
	source.addEventListener( 'error', err => {
		debug( 'Error', err );
	} );

	source.addEventListener( 'suggestion', e => {
		debug( 'fullMessage', e );
	} );
	return source;
}

/**
 * Leaving this here to make it easier to debug the streaming API calls for now
 *
 * @param {string|Array} question             - The query to send to the API
 * @param {object} options                    - Options
 * @param {number} options.postId             - The post where this completion is being requested, if available
 * @param {boolean} options.fromCache         - Get a cached response. False by default.
 * @param {boolean} options.useGpt4           - If the request should use GPT-4
 * @returns {Promise<SuggestionsEventSource>} The event source
 */
export async function askQuestion(
	question,
	{ postId = null, fromCache = false, useGpt4 = false }
) {
	const { token } = await requestJwt();

	const options = { postId, feature: useGpt4 ? 'ai-assistant-experimental' : undefined, fromCache };

	return new SuggestionsEventSource( { question, token, options } );
}
