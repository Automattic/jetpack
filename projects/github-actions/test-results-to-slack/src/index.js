const { setFailed, getInput } = require( '@actions/core' );
const { context, getOctokit } = require( '@actions/github' );
const { WebClient, retryPolicies, LogLevel } = require( '@slack/web-api' );
let client;

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

	client = new WebClient( token, {
		retryConfig: retryPolicies.rapidRetryPolicy,
		logLevel: LogLevel.ERROR,
	} );

	const isFailure = await isWorkflowFailed( ghToken );

	const status = isFailure ? 'failed' : 'passed';
	let event = context.sha;

	if ( context.eventName === 'pull_request' ) {
		const { pull_request } = context.payload;
		event = `PR \`${ pull_request.number }: ${ pull_request.title }\` (${ pull_request.html_url })`;
	}

	if ( context.eventName === 'push' ) {
		event = `commit \`${ context.sha } \` on branch \`${ context.ref.substring( 11 ) }\` ${
			context.payload.head_commit.url
		}`;
	}

	const text = `Tests ${ status } for ${ event }`;

	await sendSlackMessage( text, [], channel, username, icon_emoji );
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
 * @param {string} text - message text
 * @param {string} blocks - message blocks
 * @param {string} channel - Slack channel
 * @param {string} username - Slack bot username
 * @param {string} icon_emoji - icon emoji
 */
async function sendSlackMessage( text, blocks, channel, username, icon_emoji ) {
	await client.chat.postMessage( {
		text,
		channel,
		username,
		icon_emoji,
		unfurl_links: false,
	} );
}

/**
 * Finds and returns a Slack message based on a substring of the message text
 *
 * @param {string} channelId - the Slack channel id where to search for the message
 * @param {string} identifier - a substring of the expected message.text property
 */
// eslint-disable-next-line no-unused-vars
async function getMessage( channelId, identifier ) {
	// Get the messages in the channel. It only returns parent messages in case of threads.
	// If the message has a `thread_ts` defined we have a thread
	// If `thread_ts === ts` we have a parent message
	const result = await client.conversations.history( {
		channel: channelId,
		limit: 200,
	} );

	const matchingMessages = result.messages.filter( m => m.text.includes( identifier ) );
	return matchingMessages ? matchingMessages[ 0 ] : null;
}
