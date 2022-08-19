const github = require( '@actions/github' );
const extras = require( './extra-context' );

/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new github.getOctokit( token );

	const { runId } = github.context;
	const { repository } = extras;
	const repo = repository.split( '/' );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: repo[ 0 ],
		repo: repo[ 1 ],
		run_id: runId,
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
 * Returns an object with notification data.
 * Properties: `text` for notification's text and `id` for a unique identifier for the message.
 * that can be used later on to find this message and update it or send replies.
 *
 * @param {boolean} isFailure - whether the workflow is failed or not
 */
async function getNotificationData( isFailure ) {
	const {
		context: { eventName, sha, payload, runId, actor, serverUrl },
	} = github;
	const { refType, refName, runAttempt, triggeringActor, repository } = extras;
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
				text: `Last run: attempt ${ runAttempt } of run ${ runId }, triggered by ${ triggeringActor }`,
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
		target = `on ${ refType } *${ refName }*`;
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
				text: `Last run: attempt ${ runAttempt } of run ${ runId }, triggered by ${ triggeringActor }`,
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
		target = `for scheduled run on ${ refType } *${ refName }*`;
		// we return a timestamp because we don't ever want to group messages with schedule event
		// this way, we'll never be able to compute this same id later and cannot find this message
		msgId = `sched-${ Date.now() }`;
		const commitUrl = `${ serverUrl }/${ repository }/commit/${ sha }`;

		contextElements.push(
			{
				type: 'plain_text',
				text: `Last commit: ${ sha.substring( 0, 8 ) }`,
				emoji: false,
			},
			{
				type: 'plain_text',
				text: `Last run: attempt ${ runAttempt } of run ${ runId }, triggered by ${ triggeringActor }`,
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
				} tests in run ${ runId }, attempt ${ runAttempt }>`,
			},
		},
	];

	return { text, id: msgId, mainMsgBlocks, detailsMsgBlocks };
}

/**
 * Creates and returns a run url
 *
 * @returns {string} the run url
 */
function getRunUrl() {
	const { serverUrl, runId } = github.context;
	const { repository, runAttempt } = extras;
	return `${ serverUrl }/${ repository }/actions/runs/${ runId }/attempts/${ runAttempt }`;
}

module.exports = { isWorkflowFailed, getNotificationData };
