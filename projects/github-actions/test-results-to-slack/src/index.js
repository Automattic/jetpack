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

	const username = getInput( 'slack_username' );
	if ( ! username ) {
		setFailed( 'Input `slack_username` is required' );
		return;
	}

	const icon_emoji = getInput( 'slack_icon_emoji' );
	if ( ! icon_emoji ) {
		setFailed( 'Input `slack_icon_emoji` is required' );
		return;
	}

	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( ghToken );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		run_id: context.runId,
	} );

	// Get unique list of conclusions of completed jobs
	const conclusions = [
		...new Set(
			response.data.jobs.filter( job => job.status === 'completed' ).map( job => job.conclusion )
		),
	];

	// Decide if any we'll treat this run as failed
	const isFailure = !! conclusions.some( conclusion => conclusion !== 'success' );

	const client = new WebClient( token, {
		retryConfig: retryPolicies.rapidRetryPolicy,
		logLevel: LogLevel.ERROR,
	} );

	await client.chat.postMessage( {
		text: `Received event: '${ context.eventName }', action: '${ context.payload.action }', conclusions: ${ conclusions }, failure: ${ isFailure }`,
		channel,
		username,
		icon_emoji,
	} );
} )();
