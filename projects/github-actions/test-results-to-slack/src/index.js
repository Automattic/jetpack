const { setFailed, getInput } = require( '@actions/core' );
const { WebClient } = require( '@slack/web-api' );
const { isWorkflowFailed, getNotificationData, getMessage } = require( './utils' );

( async function main() {
	//region validate input
	const ghToken = getInput( 'github_token' );
	if ( ! ghToken ) {
		setFailed( 'Input `github_token` is required' );
		return;
	}

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( 'Input `slack_token` is required' );
		return;
	}

	const channel = getInput( 'slack_channel' );
	if ( ! channel ) {
		setFailed( 'Input `slack_channel` is required' );
		return;
	}

	const username = getInput( 'slack_username' );
	if ( ! username ) {
		setFailed( 'Input `slack_username` is required' );
		return;
	}

	let icon_emoji = getInput( 'slack_icon_emoji' );
	if ( ! icon_emoji ) {
		setFailed( 'Input `slack_icon_emoji` is required' );
		return;
	}
	//endregion

	const client = new WebClient( slackToken );

	const isFailure = await isWorkflowFailed( ghToken );
	const { text, id, mainMsgBlocks, detailsMsgBlocks } = await getNotificationData( isFailure );
	const existingMessage = await getMessage( client, channel, id );
	let mainMessageTS = existingMessage ? existingMessage.ts : undefined;
	icon_emoji = isFailure ? ':red_circle:' : ':green_circle:';

	if ( existingMessage ) {
		console.log( 'Main message found' );
		console.log( 'Updating the main message' );
		// Update the existing message
		await sendSlackMessage( client, true, {
			text: `${ text }\n${ id }`,
			blocks: mainMsgBlocks,
			channel,
			username,
			icon_emoji,
			thread_ts: mainMessageTS,
		} );

		if ( isFailure ) {
			console.log( 'Sending new reply to main message' );
			// Send a reply to the main message with the current failure result
			await sendSlackMessage( client, false, {
				text,
				blocks: detailsMsgBlocks,
				channel,
				username,
				icon_emoji,
				thread_ts: mainMessageTS,
			} );
		}
	} else {
		console.log( 'Main message not found' );
		if ( isFailure ) {
			console.log( 'Sending new main message' );
			// Send a new main message
			const response = await sendSlackMessage( client, false, {
				text: `${ text }\n${ id }`,
				blocks: mainMsgBlocks,
				channel,
				username,
				icon_emoji,
			} );
			mainMessageTS = response.ts;

			console.log( 'Sending new reply to main message' );
			// Send a reply to the main message with the current failure result
			await sendSlackMessage( client, false, {
				text,
				blocks: detailsMsgBlocks,
				channel,
				username,
				icon_emoji,
				thread_ts: mainMessageTS,
			} );
		}
	}
} )();

/**
 * Sends a Slack message
 *
 * @param {Object} client - Slack client
 * @param update
 * @param {Object} options - options
 */
async function sendSlackMessage( client, update, options ) {
	const { text, blocks = [], channel, username, icon_emoji, thread_ts } = options;

	const method = update ? 'update' : 'postMessage';
	return await client.chat[ method ]( {
		text,
		blocks,
		channel,
		ts: thread_ts,
		thread_ts,
		username,
		icon_emoji,
		unfurl_links: false,
		unfurl_media: false,
	} );
}
