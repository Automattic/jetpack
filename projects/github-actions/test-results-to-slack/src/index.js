const { setFailed, getInput } = require( '@actions/core' );
const { context, getOctokit } = require( '@actions/github' );
const { WebClient, retryPolicies, LogLevel } = require( '@slack/web-api' );

( async function main() {
	const ghToken = getInput( 'github_token' );
	if ( ! ghToken ) {
		setFailed( 'main: Input `github_token` is required' );
		return;
	}

	const token = getInput( 'slack_token' );
	if ( ! token ) {
		setFailed( 'Input `slack_token` is required' );
		return;
	}

	const channel = getInput( 'slack_channel' );
	if ( ! channel ) {
		setFailed( 'Input `slack_channel` is required' );
		return;
	}

	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( ghToken );

	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		run_id: context.runId,
	} );

	process.stdout.write( JSON.stringify( response ) );

	const conclusions = [ ...new Set( response.data.jobs.map( job => job.conclusion ) ) ];

	const client = new WebClient( token, {
		retryConfig: retryPolicies.rapidRetryPolicy,
		logLevel: LogLevel.ERROR,
	} );

	await client.chat.postMessage( {
		text: `Received event: '${ context.eventName }', action: '${ context.payload.action }', conclusions: ${ conclusions }`,
		channel,
		username: 'Tests reporter',
		icon_emoji: ':bot:',
	} );
} )();
