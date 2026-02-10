import { setFailed, getInput, startGroup, endGroup } from '@actions/core';
import { sendMessage } from './message.js';
import { getChannels } from './rules.js';

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
