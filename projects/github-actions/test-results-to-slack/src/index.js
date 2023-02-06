const { setFailed, getInput, startGroup, endGroup } = require( '@actions/core' );
const { sendMessage } = require( './message' );
const { getChannels } = require( './rules' );

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

	if ( ! getInput( 'slack_channel' ) ) {
		setFailed( 'Input `slack_channel` is required' );
		return;
	}

	const username = getInput( 'slack_username' );
	if ( ! username ) {
		setFailed( 'Input `slack_username` is required' );
		return;
	}
	//endregion

	const channels = getChannels();

	for ( const channel of channels ) {
		await sendMessage( slackToken, ghToken, channel, username );
	}

	endGroup();
} )();
