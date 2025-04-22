const fs = require( 'fs' );
const path = require( 'path' );
const { debug, error } = require( './debug' );

/**
 * Sends a Slack message.
 *
 * @param {object}  client  - Slack client
 * @param {boolean} update  - if it should update a message. For true, it will update an existing message based on `ts`, false will send a new message.
 * @param {object}  options - options
 * @return {Promise<*>} the response from the Slack API. In case when multiple messages are sent due to the blocks length the last message response is returned.
 */
async function postOrUpdateMessage( client, update, options ) {
	const { text, blocks = [], channel, username, icon_emoji, ts, thread_ts } = options;

	const method = update ? 'update' : 'postMessage';
	let response;

	// Split the blocks into chunks:
	// - blocks with type 'file' are separate chunks. 'file' type is not a valid block, and when we have one we need to call files.upload instead of chat.postMessage.
	// - chunk max size is 50 blocks, Slack API will fail if we send more
	const chunks = getBlocksChunks( blocks, 50, 'file' );

	for ( const chunk of chunks ) {
		// The expectation is that chunks with files will only have one element
		if ( chunk[ 0 ].type === 'file' ) {
			if ( ! fs.existsSync( chunk[ 0 ].path ) ) {
				const err = new Error( 'File not found: ' + chunk[ 0 ].path );
				error( err );
				throw err;
			}

			try {
				response = await uploadFileToSlack( client, chunk[ 0 ].path, channel, thread_ts );
			} catch ( err ) {
				error( err );
				throw err;
			}
		} else {
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
				throw err;
			}
		}
	}

	return response;
}

/**
 * Split an array of blocks into chunks of a given size
 *
 * @param {[object]} blocks    - the array to be split
 * @param {number}   chunkSize - the maximum size of each chunk
 * @return {[object]} the array of chunks
 */
function getBlocksChunksBySize( blocks, chunkSize ) {
	const chunks = [];
	for ( let i = 0; i < blocks.length; i += chunkSize ) {
		const chunk = blocks.slice( i, i + chunkSize );
		chunks.push( chunk );
	}
	return chunks;
}

/**
 * Split an array of blocks into chunks based on a given type property as delimiter
 * E.g. if the array is [ {type: 'context'}, {type: 'context'}, {type: 'file'}, {type: 'context'} ] and the delimiter is 'file'
 * the result will be [ [ {type: 'context'}, {type: 'context'} ], [ {type: 'file'} ], [ {type: 'context'} ] ]
 *
 * @param {[object]} blocks - the array to be split
 * @param {string}   type   - the type property to use as delimiter
 * @return {[object]} the array of chunks
 */
function getBlocksChunksByType( blocks, type ) {
	const chunks = [];
	let nextIndex = 0;

	for ( let i = 0; i < blocks.length; i++ ) {
		if ( blocks[ i ].type === type ) {
			if ( nextIndex < i ) {
				chunks.push( blocks.slice( nextIndex, i ) );
			}
			chunks.push( blocks.slice( i, i + 1 ) );
			nextIndex = i + 1;
		}
	}

	if ( nextIndex < blocks.length ) {
		chunks.push( blocks.slice( nextIndex ) );
	}

	return chunks;
}

/**
 * Split an array of blocks into chunks based on a given type property as delimiter and a max size
 *
 * @param {[object]} blocks        - the array to be split
 * @param {number}   maxSize       - the maximum size of each chunk
 * @param {string}   typeDelimiter - the type property to use as delimiter
 * @return {[object]} the array of chunks
 */
function getBlocksChunks( blocks, maxSize, typeDelimiter ) {
	const chunksByType = getBlocksChunksByType( blocks, typeDelimiter );
	const chunks = [];

	for ( const chunk of chunksByType ) {
		chunk.length > maxSize
			? chunks.push( ...getBlocksChunksBySize( chunk, maxSize ) )
			: chunks.push( chunk );
	}

	return chunks;
}

/**
 * Finds and returns a Slack message that contains a given string in its text (not in blocks!)
 *
 * @param {object} client     - the Slack client
 * @param {string} channelId  - the channel id
 * @param {string} identifier - the string to search for in the messages text
 * @return {Promise<*|null>} the message Object
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

/**
 * Uploads a file to Slack using their three-step upload process.
 * https://api.slack.com/messaging/files#uploading_files
 *
 * @param {object} client     - Slack client instance
 * @param {string} filePath   - Path to the file to upload
 * @param {string} channel_id - Channel ID where the file will be shared
 * @param {string} thread_ts  - Thread timestamp for threading the file upload
 * @return {Promise<object>} The response from the Slack API
 */
async function uploadFileToSlack( client, filePath, channel_id, thread_ts ) {
	try {
		// Get file stats for size and name
		const stats = fs.statSync( filePath );
		const filename = path.basename( filePath );

		// Step 1: Get upload URL
		const { ok, upload_url, file_id } = await client.files.getUploadURLExternal( {
			filename,
			length: stats.size,
		} );
		if ( ! ok ) {
			throw new Error( 'Failed to get upload URL' );
		}

		// Step 2: Upload file to the URL
		const fileStream = fs.createReadStream( filePath );
		const fileBuffer = await new Promise( ( resolve, reject ) => {
			const chunks = [];
			fileStream.on( 'data', chunk => chunks.push( chunk ) );
			fileStream.on( 'end', () => resolve( Buffer.concat( chunks ) ) );
			fileStream.on( 'error', reject );
		} );

		const uploadResponse = await fetch( upload_url, {
			method: 'POST',
			body: fileBuffer,
			headers: {
				'Content-Type': 'application/octet-stream',
			},
		} );

		if ( ! uploadResponse.ok ) {
			throw new Error( 'Failed to upload file to URL' );
		}

		// Step 3: Complete the upload
		const completeResponse = await client.files.completeUploadExternal( {
			files: [ { id: file_id } ],
			channel_id,
			thread_ts,
		} );

		if ( ! completeResponse.ok ) {
			throw new Error( 'Failed to complete file upload' );
		}

		return completeResponse;
	} catch ( err ) {
		error( err );
		throw err;
	}
}

module.exports = {
	getMessage,
	postOrUpdateMessage,
	getBlocksChunks,
};
