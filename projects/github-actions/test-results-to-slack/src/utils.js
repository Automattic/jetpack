const github = require( '@actions/github' );
const debug = require( './debug' );
/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new github.getOctokit( token );
	const { payload, run_id } = github.context;

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: payload.repository.owner.login,
		repo: payload.repository.name,
		run_id,
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
		context: {
			eventName,
			sha,
			ref_type,
			ref_name,
			payload,
			run_id,
			run_attempt,
			actor,
			triggering_actor,
			server_url,
			repository,
		},
	} = github;
	let target = `for ${ sha }`;
	let msgId;
	const contextElements = [];
	const buttons = [];
	const style = isFailure ? 'danger' : 'primary';

	if ( eventName === 'pull_request' ) {
		const { html_url, number, title } = payload.pull_request;
		target = `for pull request *#${ number }*`;
		msgId = `pr-${ number }`;

		contextElements.push(
			{
				type: 'plain_text',
				text: `Title: ${ title }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Actor: ${ actor }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Last run: attempt ${ run_attempt } of run ${ run_id }, triggered by ${ triggering_actor }`,
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
				url: getRunUrl(),
				style,
			},
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: `PR #${ number }`,
				},
				url: html_url,
				style,
			}
		);
	}

	if ( eventName === 'push' ) {
		const { url, id, message } = payload.head_commit;
		target = `on ${ ref_type } *${ ref_name }*`;
		msgId = `commit-${ id }`;

		contextElements.push(
			{
				type: 'plain_text',
				text: `Commit: ${ id.substring( 0, 8 ) } ${ message }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Actor: ${ actor }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Last run: attempt ${ run_attempt } of run ${ run_id }, triggered by ${ triggering_actor }`,
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
				url: getRunUrl(),
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
		target = `for scheduled run on ${ ref_type } *${ ref_name }*`;
		// we return a timestamp because we don't ever want to group messages with schedule event
		// this way, we'll never be able to compute this same id later and cannot find this message
		msgId = `sched-${ Date.now() }`;
		const commitUrl = `${ server_url }/${ repository }/commit/${ sha }`;

		contextElements.push(
			{
				type: 'plain_text',
				text: `Last commit: ${ sha.substring( 0, 8 ) }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Last run: attempt ${ run_attempt } of run ${ run_id }, triggered by ${ triggering_actor }`,
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
				url: getRunUrl(),
				style,
			},
			{
				type: 'button',
				text: {
					type: 'plain_text',
					text: `Commit ${ sha.substring( 0, 8 ) }`,
				},
				url: commitUrl,
				style,
			}
		);
	}

	const text = `Tests ${ isFailure ? 'failed' : 'passed' } ${ target }`;
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
				text: `<${ getRunUrl() } | New ${
					isFailure ? 'failed' : 'passed'
				} tests in run ${ run_id }, attempt ${ run_attempt }>`,
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
	debug( `Looking for ${ identifier }` );
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

	debug( `Found message: ${ message }` );
	return message;
}

/**
 * Creates and returns a run url
 *
 * @returns {string} the run url
 */
function getRunUrl() {
	const { server_url, repository, run_id, run_attempt } = github.context;
	return `${ server_url }/${ repository }/actions/runs/${ run_id }/attempts/${ run_attempt }`;
}

module.exports = { isWorkflowFailed, getNotificationData, getMessage };
