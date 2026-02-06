import { getInput, setFailed } from '@actions/core';
import { WebClient, ErrorCode } from '@slack/web-api';
import type { PullRequestEvent, IssuesEvent, IssueCommentEvent } from '../../types.ts';
import type { ChatPostMessageArguments } from '@slack/web-api';

type SlackPayload = PullRequestEvent | IssuesEvent | IssueCommentEvent;

/**
 * Send a message to a Slack channel using the Slack API.
 *
 * @param message             - Message to post to Slack.
 * @param channel             - Slack channel ID.
 * @param payload             - Pull request or issue event payload.
 * @param customMessageFormat - Custom message formatting. If defined, takes over from message completely.
 * @return Promise resolving to a boolean, whether message was successfully posted or not.
 */
async function sendSlackMessage(
	message: string,
	channel: string,
	payload: SlackPayload,
	customMessageFormat: ChatPostMessageArguments | Record< string, never > = {}
): Promise< boolean | undefined > {
	const token = getInput( 'slack_token' );
	if ( ! token ) {
		setFailed( 'triage-issues: Input slack_token is required but missing. Aborting.' );
		return;
	}

	const slackApi = new WebClient( token );

	let slackMessage: ChatPostMessageArguments;

	// If we have a custom message format, use it.
	if ( Object.keys( customMessageFormat ).length > 0 ) {
		slackMessage = customMessageFormat as ChatPostMessageArguments;
	} else {
		const { repository } = payload;
		const prOrIssue = 'pull_request' in payload ? payload.pull_request : payload.issue;
		const { html_url, title, user } = prOrIssue;

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
	} catch ( error: unknown ) {
		// The request failed.
		// At this point, we want to log specific types of errors (let's avoid noise by logging temporary errors for example).
		const slackError = error as { code?: string; data?: { error?: string } };
		if ( slackError.code !== ErrorCode.PlatformError ) {
			return false;
		}

		// See the list of error messages here: https://api.slack.com/methods/chat.postMessage#errors
		const errorMessage = slackError?.data?.error ?? 'Unknown error';

		// Let's send a direct message to @jeherve about it, so we can investigate.
		// For folks outside of Automattic, let's use the Quality team channel.
		const {
			repository: { owner },
		} = payload;
		const prOrIssue = 'pull_request' in payload ? payload.pull_request : payload.issue;
		const { html_url, title } = prOrIssue;

		const reportingChannel =
			owner.login === 'automattic' ? 'D1KN8VCCA' : getInput( 'slack_quality_channel' );
		if ( ! reportingChannel ) {
			return false;
		}
		const reportMessage: ChatPostMessageArguments = {
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

export default sendSlackMessage;
