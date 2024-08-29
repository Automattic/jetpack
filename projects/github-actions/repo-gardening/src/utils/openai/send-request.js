const { getInput, setFailed } = require( '@actions/core' );
const OpenAI = require( 'openai' );
const debug = require( '../debug' );

/**
 * Send a message to OpenAI.
 *
 * @param {string} message - Message to send to OpenAI.
 *
 * @return {Promise<string>} Promise resolving to the response from OpenAI.
 */
async function sendOpenAiRequest( message ) {
	const apiKey = getInput( 'openai_api_key' );
	if ( ! apiKey ) {
		setFailed( 'openai: Input openai_api_key is required but missing. Aborting.' );
		return;
	}

	const client = new OpenAI( {
		apiKey,
		baseURL: 'https://public-api.wordpress.com/wpcom/v2/openai-proxy/v1',
	} );

	const chatCompletion = await client.chat.completions.create( {
		messages: [
			{ role: 'system', content: 'You are a helpful assistant.' },
			{ role: 'user', content: message },
		],
		model: 'gpt-4',
	} );

	debug( `openai: Chat completion: ${ JSON.stringify( chatCompletion ) }` );

	return chatCompletion.data.choices[ 0 ].message.content;
}

module.exports = sendOpenAiRequest;
