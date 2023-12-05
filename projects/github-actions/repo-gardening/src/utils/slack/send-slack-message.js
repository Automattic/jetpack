const { getInput, setFailed } = require( '@actions/core' );
const fetch = require( 'node-fetch' );

/* global WebhookPayloadPullRequest, WebhookPayloadIssue */

/**
 * Send a message to a Slack channel using the Slack API.
 *
 * @param {string}                                        message             - Message to post to Slack
 * @param {string}                                        channel             - Slack channel ID.
 * @param {WebhookPayloadPullRequest|WebhookPayloadIssue} payload             - Pull request event payload.
 * @param {object}                                        customMessageFormat - Custom message formatting. If defined, takes over from message completely.
 * @returns {Promise<boolean>} Promise resolving to a boolean, whether message was successfully posted or not.
 */
async function sendSlackMessage( message, channel, payload, customMessageFormat = {} ) {
	const token = getInput( 'slack_token' );
	if ( ! token ) {
		setFailed( 'triage-issues: Input slack_token is required but missing. Aborting.' );
		return;
	}

	let slackMessage = '';

	// If we have a custom message format, use it.
	if ( Object.keys( customMessageFormat ).length > 0 ) {
		slackMessage = customMessageFormat;
	} else {
		const { repository } = payload;
		const { html_url, title, user } = payload?.pull_request ?? payload.issue;

		slackMessage = {
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
						text: `PR created by ${ user.login } in the <${ repository.html_url }|${ repository.full_name }> repo.`,
					},
				},
				{
					type: 'divider',
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<${ html_url }|${ title }>`,
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
			text: `${ message } -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
			mrkdwn: true, // Formatting of the fallback text.
			unfurl_links: false,
			unfurl_media: false,
		};
	}

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

	return !! slackRequest.ok;
}

module.exports = sendSlackMessage;
