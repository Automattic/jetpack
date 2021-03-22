/**
 * External dependencies
 */
const fetch = require( 'node-fetch' );

/**
 * Internal dependencies
 */
const debug = require( './debug' );

/* global WebhookPayloadPullRequest */

/**
 * Send a message to a Slack channel using the Slack API.
 *
 * @param {string}                    message - Message to post to Slack
 * @param {string}                    channel - Slack channel ID.
 * @param {string}                    token   - Slack token.
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 *
 * @returns {Promise<boolean>} Promise resolving to a boolean, whether message was successfully posted or not.
 */
async function sendSlackMessage( message, channel, token, payload ) {
	const { pull_request, repository } = payload;
	const { html_url, title, user } = pull_request;

	const slackMessage = {
		channel,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `${ message }`,
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `PR created by ${ user.login } in the [${ repository.full_name }](${ repository.html_url }) repo.`,
				},
			},
			{
				type: 'divider',
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `[${ title }](${ html_url })`,
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Review',
						emoji: true,
					},
					value: 'click_review',
					url: `${ html_url }`,
					action_id: 'button-action',
				},
			},
		],
		text: `${ message } -- [${ title }](${ html_url })`, // Fallback text for display in notifications.
		mrkdwn: true, // Formatting of the fallback text.
	};

	const slackRequest = await fetch( 'https://slack.com/api/chat.postMessage', {
		method: 'POST',
		body: JSON.stringify( slackMessage ),
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Length': slackMessage.length,
			Authorization: `Bearer ${ token }`,
			Accept: 'application/json',
		},
	} );

	debug( `send-slack-message: response: ${ JSON.stringify( slackRequest ) }` );

	if ( ! slackRequest.ok ) {
		return false;
	}

	return true;
}

module.exports = sendSlackMessage;
