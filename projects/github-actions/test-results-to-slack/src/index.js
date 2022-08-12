const { setFailed, getInput } = require( '@actions/core' );
const { WebClient } = require( '@slack/web-api' );
const { isWorkflowFailed, getNotificationText } = require( './utils' );

( async function main() {
	const ghToken = getInput( 'github_token' );
	if ( ! ghToken ) {
		setFailed( 'main: Input `github_token` is required' );
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
	const isFailure = await isWorkflowFailed( ghToken );

	if ( ! isFailure ) {
		// this is only temporary. In the future: it will send notification for success if the previous run was failed.
		return;
	}

	icon_emoji = isFailure ? ':red_circle:' : ':green_circle:';

	const text = await getNotificationText( isFailure );

	await sendSlackMessage( slackToken, text, [], channel, username, icon_emoji );
} )();

/**
 * Sends a Slack message
 *
 * @param {string} token - slack token
 * @param {string} text - message text
 * @param {string} blocks - message blocks
 * @param {string} channel - slack channel
 * @param {string} username - slack bot username
 * @param {string} icon_emoji - icon emoji
 */
async function sendSlackMessage( token, text, blocks, channel, username, icon_emoji ) {
	const client = new WebClient( token );
	await client.chat.postMessage( {
		text,
		channel,
		username,
		icon_emoji,
		unfurl_links: false,
		unfurl_media: false,
	} );
}
