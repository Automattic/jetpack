const { getInput } = require( '@actions/core' );
const github = require( '@actions/github' );
const { WebClient } = require( '@slack/web-api' );
const { debug } = require( './debug' );
const extras = require( './extra-context' );
const { isWorkflowFailed, getRunUrl } = require( './github' );
const { getPlaywrightBlocks } = require( './playwright' );
const { getMessage, postOrUpdateMessage } = require( './slack' );

/**
 * Returns an object with notification data.
 * Properties: `text` for notification's text and `id` for a unique identifier for the message.
 * that can be used later on to find this message and update it or send replies.
 *
 * @param {boolean} isFailure - whether the workflow is failed or not
 */
async function createMessage( isFailure ) {
	const {
		context: { eventName, sha, payload, runId, actor, serverUrl },
	} = github;
	const { refType, refName, runAttempt, triggeringActor, repository } = extras;
	let target = `for ${ sha }`;
	let msgId;
	const contextElements = [];
	const buttons = [];

	const lastRunBlock = getTextContextElement(
		`Last run: ${ runId }/${ runAttempt }, triggered by ${ triggeringActor }`
	);
	const actorBlock = getTextContextElement( `Actor: ${ actor }` );
	const lastRunButtonBlock = getButton( 'Last run', getRunUrl( false ) );

	if ( eventName === 'pull_request' ) {
		const { html_url, number, title } = payload.pull_request;
		target = `for pull request *#${ number }*`;
		msgId = `pr-${ number }`;

		contextElements.push( getTextContextElement( `Title: ${ title }` ), actorBlock, lastRunBlock );

		buttons.push( lastRunButtonBlock, getButton( `PR #${ number }`, html_url ) );
	}

	if ( eventName === 'push' ) {
		const { url, id, message } = payload.head_commit;
		target = `on ${ refType } _*${ refName }*_`;
		msgId = `commit-${ id }`;
		const truncatedMessage = message.length > 50 ? message.substring( 0, 48 ) + '...' : message;

		contextElements.push(
			getTextContextElement( `Commit: ${ id.substring( 0, 8 ) } ${ truncatedMessage }` ),
			actorBlock,
			lastRunBlock
		);

		buttons.push( lastRunButtonBlock, getButton( `Commit ${ id.substring( 0, 8 ) }`, url ) );
	}

	if ( eventName === 'schedule' ) {
		target = `for scheduled run on ${ refType } _*${ refName }*_`;
		// we return a timestamp because we don't ever want to group messages with schedule event
		// this way, we'll never be able to compute this same id later and cannot find this message
		msgId = `sched-${ Date.now() }`;
		const commitUrl = `${ serverUrl }/${ repository }/commit/${ sha }`;

		contextElements.push(
			getTextContextElement( `Last commit: ${ sha.substring( 0, 8 ) }` ),
			lastRunBlock
		);

		buttons.push( lastRunButtonBlock, getButton( `Commit ${ sha.substring( 0, 8 ) }`, commitUrl ) );
	}

	const statusIcon = `${ isFailure ? ':x:' : ':white_check_mark:' }`;
	const statusText = `${ isFailure ? 'failed' : 'passed' }`;
	const suite = getInput( 'suite_name' );
	const suiteText = suite ? `_*${ suite }*_ tests` : 'Tests';
	const text = `${ statusIcon }	${ suiteText } ${ statusText } ${ target }`;

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

	const detailsMsgBlocksChunks = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `<${ getRunUrl() } | Run ${ runId }/${ runAttempt } ${
					isFailure ? 'has failures' : 'was successful'
				}>`,
			},
		},
	];

	detailsMsgBlocksChunks.push( ...getPlaywrightBlocks() );

	return { text, id: msgId, mainMsgBlocks, detailsMsgBlocksChunks };
}

/**
 * Returns a Slack context block element with a given text.
 *
 * @param {string} text - the text of the element
 * @returns {object} - the block element
 */
function getTextContextElement( text ) {
	return {
		type: 'plain_text',
		text,
		emoji: false,
	};
}

/**
 * Returns a Slack button element with a given text and url.
 *
 * @param {string} text - the text of the button
 * @param {string} url - the url of the button
 * @returns {object} - the button element
 */
function getButton( text, url ) {
	return {
		type: 'button',
		text: {
			type: 'plain_text',
			text,
		},
		url,
	};
}

/**
 * Creates the message and sends it if the rules are met.
 *
 * @param {string} slackToken - the Slack token
 * @param {string} ghToken - the GitHub token
 * @param {string} channel - the id of the channel to send the message to
 * @param {string} username - the username to use when sending the message
 */
async function sendMessage( slackToken, ghToken, channel, username ) {
	const client = new WebClient( slackToken );
	const isFailure = await isWorkflowFailed( ghToken );
	const { text, id, mainMsgBlocks, detailsMsgBlocksChunks } = await createMessage( isFailure );

	const icon_emoji = getInput( 'slack_icon_emoji' );
	const existingMessage = await getMessage( client, channel, id );
	let mainMessageTS = existingMessage ? existingMessage.ts : undefined;

	if ( existingMessage ) {
		debug( 'Main message found' );
		debug( 'Updating the main message' );
		// Update the existing message
		await postOrUpdateMessage( client, true, {
			text: `${ text }\n${ id }`,
			blocks: mainMsgBlocks,
			channel,
			username,
			ts: mainMessageTS,
		} );

		if ( isFailure ) {
			debug( 'Sending new reply to main message with failure details' );
			// Send replies to the main message with the current failure result
			await postOrUpdateMessage( client, false, {
				text,
				blocks: detailsMsgBlocksChunks,
				channel,
				username,
				icon_emoji,
				thread_ts: mainMessageTS,
			} );
		}
	} else {
		debug( 'Main message not found' );
		if ( isFailure ) {
			debug( 'Sending new main message' );
			// Send a new main message
			const response = await postOrUpdateMessage( client, false, {
				text: `${ text }\n${ id }`,
				blocks: mainMsgBlocks,
				channel,
				username,
				icon_emoji,
			} );
			mainMessageTS = response.ts;

			debug( 'Sending new reply to main message with failure details' );
			// Send replies to the main message with the current failure result
			await postOrUpdateMessage( client, false, {
				text,
				blocks: detailsMsgBlocksChunks,
				channel,
				username,
				icon_emoji,
				thread_ts: mainMessageTS,
			} );
		} else {
			debug( 'No previous failure found, no notification needed for success' );
		}
	}
}

module.exports = { sendMessage, createMessage };
