const { setFailed, getInput } = require( '@actions/core' );
const { context } = require( '@actions/github' );
const { WebClient, retryPolicies, LogLevel } = require( '@slack/web-api' );

( async function main() {
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

	const slackChannel = getInput( 'slack_channel' );
	if ( ! slackChannel ) {
		setFailed( 'Input `slack_channel` is required' );
		return;
	}

	process.stdout.write(
		`Received event = '${ context.eventName }', action = '${ context.payload.action }'`
	);

	const slackClient = new WebClient( slackToken, {
		retryConfig: retryPolicies.rapidRetryPolicy,
		logLevel: LogLevel.ERROR,
	} );

	await slackClient.chat.postMessage( {
		text: `Received event = '${ context.eventName }', action = '${ context.payload.action }'`,
		channel: slackChannel,
		username: 'Tests reporter',
		icon_emoji: ':jetpack:',
	} );
} )();
