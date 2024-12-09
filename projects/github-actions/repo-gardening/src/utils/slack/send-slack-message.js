const { getInput, setFailed } = require( '@actions/core' );
const { WebClient, ErrorCode } = require( '@slack/web-api' );

/* global WebhookPayloadPullRequest, WebhookPayloadIssue */

/**
 * Send a message to a Slack channel using the Slack API.
 *
 * @param {string}                                        message             - Message to post to Slack
 * @param {string}                                        channel             - Slack channel ID.
 * @param {WebhookPayloadPullRequest|WebhookPayloadIssue} payload             - Pull request event payload.
 * @param {object}                                        customMessageFormat - Custom message formatting. If defined, takes over from message completely.
 * @return {Promise<boolean>} Promise resolving to a boolean, whether message was successfully posted or not.
 */
async function sendSlackMessage( message, channel, payload, customMessageFormat = {} ) {
	const token = getInput( 'slack_token' );
	if ( ! token ) {
		setFailed( 'triage-issues: Input slack_token is required but missing. Aborting.' );
		return;
	}

	const slackApi = new WebClient( token );

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

	try {
		const slackRequest = await slackApi.chat.postMessage( slackMessage );
		return !! slackRequest.ok;
	} catch ( error ) {
		// The request failed.
		// At this point, we want to log specific types of errors (let's avoid noise by logging temporary errors for example).
		if ( error.code !== ErrorCode.PlatformError ) {
			return false;
		}

		// See the list of error messages here: https://api.slack.com/methods/chat.postMessage#errors
		const errorMessage = error?.data?.error ?? 'Unknown error';

		// Let's send a direct message to @jeherve about it, so we can investigate.
		// For folks outside of Automattic, let's use the Quality team channel.
		const {
			repository: { owner },
		} = payload;
		const { html_url, title } = payload?.pull_request ?? payload.issue;

		const reportingChannel =
			owner === 'automattic' ? 'D1KN8VCCA' : getInput( 'slack_quality_channel' );
		if ( ! reportingChannel ) {
			return false;
		}
		const reportMessage = {
			channel: reportingChannel,
			blocks: [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `We attempted to send a Slack message to ${ reportingChannel } about the issue below, but received the following error: \`${ errorMessage }\``,
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
			text: `Error sending message to Slack: -- <${ html_url }|${ title }>`, // Fallback text for display in notifications.
			mrkdwn: true, // Formatting of the fallback text.
			unfurl_links: false,
			unfurl_media: false,
		};
		const reportMessageSlackResponse = await slackApi.chat.postMessage( reportMessage );
		return !! reportMessageSlackResponse.ok;
	}
}

module.exports = sendSlackMessage;
