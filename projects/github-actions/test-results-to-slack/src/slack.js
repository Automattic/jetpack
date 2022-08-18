const debug = require( './debug' );

/**
 * Sends a Slack message.
 *
 * @param {Object} client - Slack client
 * @param {boolean} update - if it should update a message. For true, it will update an existing message based on `ts`, false will send a new message.
 * @param {Object} options - options
 */
async function sendMessage( client, update, options ) {
	const { text, blocks = [], channel, username, icon_emoji, ts, thread_ts } = options;

	const method = update ? 'update' : 'postMessage';
	return await client.chat[ method ]( {
		text,
		blocks,
		channel,
		ts,
		thread_ts,
		username,
		icon_emoji,
		unfurl_links: false,
		unfurl_media: false,
	} );
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

module.exports = { getMessage, sendMessage };
