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

	let icon_emoji = getInput( 'slack_icon_emoji' );
	if ( ! icon_emoji ) {
		setFailed( 'Input `slack_icon_emoji` is required' );
		return;
	}

	const isFailure = await isWorkflowFailed( ghToken );

	const status = isFailure ? 'failed' : 'passed';
	icon_emoji = isFailure ? ':red_circle:' : ':green_circle:';
	let event = context.sha;

	if ( context.eventName === 'pull_request' ) {
		const { pull_request } = context.payload;
		event = `PR <${ pull_request.html_url }|${ pull_request.number }: ${ pull_request.title }>`;
	}
	if ( context.eventName === 'push' ) {
		event = `commit <${ context.payload.head_commit.url }|${
			context.sha
		}> on branch *${ context.ref.substring( 11 ) }*`;
	}

	const text = `Tests ${ status } for ${ event }`;

	await sendSlackMessage( token, text, [], channel, username, icon_emoji );
} )();

/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( token );

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
	return !! conclusions.some( conclusion => conclusion !== 'success' );
}

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
	const client = new WebClient( token, {
		retryConfig: retryPolicies.rapidRetryPolicy,
		logLevel: LogLevel.ERROR,
	} );

	await client.chat.postMessage( {
		text,
		channel,
		username,
		icon_emoji,
		unfurl_links: false,
		unfurl_media: false,
	} );
}
