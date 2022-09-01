const fs = require( 'fs' );
const { debug, error } = require( './debug' );

/**
 * Sends a Slack message.
 *
 * @param {Object} client - Slack client
 * @param {boolean} update - if it should update a message. For true, it will update an existing message based on `ts`, false will send a new message.
 * @param {Object} options - options
 * @returns {Promise<*>} the response from the Slack API. In case when multiple messages are sent due to the blocks length the last message response is returned.
 */
async function postOrUpdateMessage( client, update, options ) {
	const { text, blocks = [], channel, username, icon_emoji, ts, thread_ts } = options;

	const method = update ? 'update' : 'postMessage';
	let response;

	// Sending message will fail for more than 50 blocks
	const chunks = blocks.length > 50 ? getBlocksChunks( blocks, 50 ) : [ blocks ];

	for ( const chunk of chunks ) {
		try {
			response = await client.chat[ method ]( {
				text,
				blocks: chunk,
				channel,
				ts,
				thread_ts,
				username,
				icon_emoji,
				unfurl_links: false,
				unfurl_media: false,
			} );
		} catch ( err ) {
			error( err );
		}
	}

	return response;
}

/**
 * Uploads a file to Slack
 *
 * @param {object} client - the Slack client
 * @param {string} filePath - the path to the file to upload
 * @param {string} channel - the channel to upload the file to
 */
//eslint-disable-next-line no-unused-vars
async function uploadFile( client, filePath, channel ) {
	let response;
	try {
		response = await client.files.upload( {
			fileName: filePath,
			file: fs.createReadStream( filePath ),
			channel,
		} );
	} catch ( err ) {
		error( err );
	}
	return response;
}

/**
 * Split an array of blocks into chunks of a given size
 *
 * @param {[object]} blocks - the array to be split
 * @param {number} chunkSize - the maximum size of each chunk
 * @returns {[object]} the array of chunks
 */
function getBlocksChunks( blocks, chunkSize ) {
	const chunks = [];
	for ( let i = 0; i < blocks.length; i += chunkSize ) {
		const chunk = blocks.slice( i, i + chunkSize );
		chunks.push( chunk );
	}
	return chunks;
}

/**
 * Finds and returns a Slack message that contains a given string in its text (not in blocks!)
 *
 * @param {Object} client - the Slack client
 * @param {string} channelId - the channel id
 * @param {string} identifier - the string to search for in the messages text
 * @returns {Promise<*|null>} the message Object
 */
async function getMessage( client, channelId, identifier ) {
	debug( `Looking for ${ identifier }` );
	let message;
	// Get the messages in the channel. It only returns parent messages in case of threads.
	// If the message has a `thread_ts` defined we have a thread
	// If `thread_ts === ts` we have a parent message
	const result = await client.conversations.history( {
		channel: channelId,
		limit: 200,
	} );

	if ( result.ok && result.messages ) {
		// should not find more than one message, but, just in case
		// the first message found should be the most recent
		message = result.messages.filter( m => m.text.includes( identifier ) )[ 0 ];
	}

	message ? debug( 'Message found' ) : debug( 'Message not found' );

	return message;
}

module.exports = { getMessage, postOrUpdateMessage };
