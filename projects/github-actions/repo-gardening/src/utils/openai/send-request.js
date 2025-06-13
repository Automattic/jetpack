const { getInput, setFailed } = require( '@actions/core' );
const OpenAI = require( 'openai' );
const debug = require( '../debug' );

/**
 * Send a message to OpenAI.
 *
 * @param {string} message        - Message to send to OpenAI.
 * @param {string} responseFormat - Response format to use (plain by default, can be 'json_object').
 *
 * @return {Promise<string|undefined>} Promise resolving to the response from OpenAI, or undefined if an error occurred.
 */
async function sendOpenAiRequest( message, responseFormat = 'plain' ) {
	const apiKey = getInput( 'openai_api_key' );
	if ( ! apiKey ) {
		setFailed( 'openai: Input openai_api_key is required but missing.' );
		return;
	}

	const client = new OpenAI( {
		apiKey,
		baseURL: 'https://public-api.wordpress.com/wpcom/v2/ai-api-proxy/v1',
	} );

	debug( 'openai: Sending message to OpenAI.' );

	try {
		const completion = await client.chat.completions.create( {
			messages: [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: message },
			],
			model: 'gpt-4o-mini',
			response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
		} );

		return completion?.choices?.[ 0 ]?.message?.content ?? '';
	} catch ( error ) {
		setFailed( `openai: Error sending message to OpenAI: ${ error }` );
	}
}

module.exports = sendOpenAiRequest;
