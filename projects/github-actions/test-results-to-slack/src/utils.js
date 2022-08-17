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
 * Returns na object with notification data.
 * Properties: `text` for notification's text and `id` for a unique identifier for the message
 * that can be used later on to find this message and update it or send replies.
 *
 * @param {boolean} isFailure - whether the workflow is failed or not
 */
async function getNotificationData( isFailure ) {
	const {
		context: { eventName, sha, ref_type, ref_name, payload, runId },
	} = github;
	let event = sha;
	let msgId;
	const contextElements = [];
	const buttons = [];
	const style = isFailure ? 'danger' : 'primary';

	if ( eventName === 'pull_request' ) {
		const { html_url, number, title } = payload.pull_request;
		event = `PR <${ html_url }|${ number }: ${ title }>`;
		msgId = `pr-${ number }`;
		contextElements.push( {
			type: 'plain_text',
			text: 'Author: ',
			emoji: false,
		} );
	}

	if ( eventName === 'push' ) {
		const { url, id, author, message } = payload.head_commit;
		event = `on ${ ref_type } *${ ref_name }*`;
		msgId = `commit-${ id }`;

		contextElements.push(
			{
				type: 'plain_text',
				text: `Last run id: ${ runId }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Commit: ${ id } | ${ message }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Author: ${ author.name }`,
				emoji: false,
			}
		);

		buttons.push(
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: `Last run`,
				},
				url: 'https://github.com',
				style,
			},
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: `Commit ${ id.substring( 0, 8 ) }`,
				},
				url,
				style,
			}
		);
	}

	if ( eventName === 'schedule' ) {
		event = `scheduled run on ${ ref_type } *${ ref_name }*`;
		// we return a timestamp because we don't ever want to group messages with schedule event
		// this way, we'll never be able to compute this same id later and cannot find this message
		msgId = `sched-${ Date.now() }`;
	}

	const text = `Tests ${ isFailure ? 'failed' : 'passed' } for ${ event }`;
	const mainMsgBlocks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text,
			},
		},
		{
			type: 'context',
			elements: contextElements,
		},
		{
			type: 'actions',
			elements: buttons,
		},
	];

	const detailsMsgBlocks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `New ${ isFailure ? 'failed' : 'passed' } tests in run ${ runId }`,
			},
		},
	];

	return { text, id: msgId, mainMsgBlocks, detailsMsgBlocks };
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
	console.log( `Looking for ${ identifier }` );
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

	console.log( `Found ${ message }` );
	return message;
}

module.exports = { isWorkflowFailed, getNotificationData, getMessage };
