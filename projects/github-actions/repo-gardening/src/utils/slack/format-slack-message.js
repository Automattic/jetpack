/* global WebhookPayloadIssue */

/**
 * Build an object containing the slack message and its formatting to send to Slack.
 * This is a basic message. For more complex messages, you can build your own object and pass it to the sendSlackMessage function.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {string}              channel - Slack channel ID.
 * @param {string}              message - Basic message (without the formatting).
 * @returns {object} Object containing the slack message and its formatting.
 */
function formatSlackMessage( payload, channel, message ) {
	const { issue } = payload;
	const { html_url, title } = issue;

	return {
		channel,
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message,
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
			},
		],
		text: `${ message } -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
		mrkdwn: true, // Formatting of the fallback text.
		unfurl_links: false,
		unfurl_media: false,
	};
}

module.exports = formatSlackMessage;
