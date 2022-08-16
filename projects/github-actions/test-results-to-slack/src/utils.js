const github = require( '@actions/github' );
/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new github.getOctokit( token );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: github.context.payload.repository.owner.login,
		repo: github.context.payload.repository.name,
		run_id: github.context.runId,
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
 * Creates the notification message text
 *
 * @param {boolean} isFailure - whether the workflow is failed or not
 */
async function getNotificationText( isFailure ) {
	const {
		context: { eventName, sha, ref_type, ref_name, payload },
	} = github;
	let event = sha;

	if ( eventName === 'pull_request' ) {
		const { html_url, number, title } = payload.pull_request;
		event = `PR <${ html_url }|${ number }: ${ title }>`;
	}

	if ( eventName === 'push' ) {
		const { url, id } = payload.head_commit;
		event = `commit <${ url }|${ id }> on ${ ref_type } *${ ref_name }*`;
	}

	if ( eventName === 'schedule' ) {
		event = `scheduled run on ${ ref_type } *${ ref_name }*`;
	}

	return `Tests ${ isFailure ? 'failed' : 'passed' } for ${ event }`;
}

/**
 * Finds and returns a Slack message that contains a given string in its text (not in blocks!)
 *
 * @param {Object} client - the Slack client
 * @param {string} channelId - the channel id
 * @param {string} identifier - the string to search for in the messages text
 * @returns {Promise<*|null>} the message Object
 */
async function getMessage( client, channelId, identifier ) {
	let message;
	// Get the messages in the channel. It only returns parent messages in case of threads.
	// If the message has a `thread_ts` defined we have a thread
	// If `thread_ts === ts` we have a parent message
	const result = await client.conversations.history( {
		channel: channelId,
		limit: 200,
	} );

	if ( result.ok && result.messages ) {
		// should not find more than one message, but, just in case
		// the first message found should be the most recent
		message = result.messages.filter( m => m.text.includes( identifier ) )[ 0 ];
	}

	return message;
}

module.exports = { isWorkflowFailed, getNotificationText, getMessage };
