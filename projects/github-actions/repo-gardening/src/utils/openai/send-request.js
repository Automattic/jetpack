const { getInput, setFailed } = require( '@actions/core' );
const OpenAI = require( 'openai' );
const debug = require( '../debug' );

/**
 * Send a message to OpenAI.
 *
 * @param {string} message - Message to send to OpenAI.
 *
 * @return {Promise<string|void>} Promise resolving to the response from OpenAI, or void if an error occurred.
 */
async function sendOpenAiRequest( message ) {
	const apiKey = getInput( 'openai_api_key' );
	if ( ! apiKey ) {
		setFailed( 'openai: Input openai_api_key is required but missing.' );
	}

	const client = new OpenAI( {
		apiKey,
		baseURL: 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1',
	} );

	debug( 'openai: Sending message to OpenAI.' );

	try {
		const completion = await client.chat.completions.create( {
			messages: [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: message },
			],
			model: 'gpt-4o-mini',
		} );

		return completion?.choices?.[ 0 ]?.message?.content ?? '';
	} catch ( error ) {
		setFailed( `openai: Error sending message to OpenAI: ${ error }` );
	}
}

module.exports = sendOpenAiRequest;
