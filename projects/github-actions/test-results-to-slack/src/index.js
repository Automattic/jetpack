const { setFailed, getInput, startGroup, endGroup } = require( '@actions/core' );
const { WebClient } = require( '@slack/web-api' );
const debug = require( './debug' );
const { isWorkflowFailed, getNotificationData } = require( './github' );
const { getChannels } = require( './rules' );
const { getMessage, sendMessage } = require( './slack' );

( async function main() {
	startGroup( 'Send results to Slack' );

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

	const defaultChannel = getInput( 'slack_channel' );
	if ( ! defaultChannel ) {
		setFailed( 'Input `slack_channel` is required' );
		return;
	}

	const username = getInput( 'slack_username' );
	if ( ! username ) {
		setFailed( 'Input `slack_username` is required' );
		return;
	}
	//endregion

	const client = new WebClient( slackToken );
	const isFailure = await isWorkflowFailed( ghToken );
	const { text, id, mainMsgBlocks, detailsMsgBlocks } = await getNotificationData( isFailure );
	const icon_emoji = getInput( 'slack_icon_emoji' );

	const channels = getChannels();
	for ( const channel of channels ) {
		const existingMessage = await getMessage( client, channel, id );
		let mainMessageTS = existingMessage ? existingMessage.ts : undefined;

		if ( existingMessage ) {
			debug( 'Main message found' );
			debug( 'Updating the main message' );
			// Update the existing message
			await sendMessage( client, true, {
				text: `${ text }\n${ id }`,
				blocks: mainMsgBlocks,
				channel,
				username,
				ts: mainMessageTS,
			} );

			if ( isFailure ) {
				debug( 'Sending new reply to main message with failure details' );
				// Send a reply to the main message with the current failure result
				await sendMessage( client, false, {
					text,
					blocks: detailsMsgBlocks,
					channel,
					username,
					icon_emoji,
					thread_ts: mainMessageTS,
				} );
			}
		} else {
			debug( 'Main message not found' );
			if ( isFailure ) {
				debug( 'Sending new main message' );
				// Send a new main message
				const response = await sendMessage( client, false, {
					text: `${ text }\n${ id }`,
					blocks: mainMsgBlocks,
					channel,
					username,
					icon_emoji,
				} );
				mainMessageTS = response.ts;

				debug( 'Sending new reply to main message with failure details' );
				// Send a reply to the main message with the current failure result
				await sendMessage( client, false, {
					text,
					blocks: detailsMsgBlocks,
					channel,
					username,
					icon_emoji,
					thread_ts: mainMessageTS,
				} );
			} else {
				debug( 'No previous failure found, no notification needed for success' );
			}
		}
	}

	endGroup();
} )();
