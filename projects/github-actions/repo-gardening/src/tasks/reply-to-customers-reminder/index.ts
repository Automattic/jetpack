import { getInput, setFailed } from '@actions/core';
import debug from '../../utils/debug.ts';
import getComments from '../../utils/get-comments.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import hasManySupportReferences from '../../utils/parse-content/has-many-support-references.ts';
import sendSlackMessage from '../../utils/slack/send-slack-message.ts';
import type { OctokitClient, IssuesEvent } from '../../types.ts';

/**
 * Check for a High or Blocker Priority label on an issue.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - Issue number.
 * @return Promise resolving to boolean.
 */
async function hasHighPriorityLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );

	return labels.some( label => label === '[Pri] High' || label === '[Pri] BLOCKER' );
}

/**
 * Build an object containing the slack message and its formatting to send to Slack.
 *
 * @param payload - Issue event payload.
 * @param channel - Slack channel ID.
 * @param message - Basic message (without the formatting).
 * @return Object containing the slack message and its formatting.
 */
function formatSlackMessage( payload: IssuesEvent, channel: string, message: string ) {
	const { issue, repository } = payload;
	const { html_url, title } = issue;

	let dris = '@bug_herders';
	switch ( repository.full_name ) {
		case 'Automattic/jetpack':
			dris = '@jetpack-da';
			break;
	}

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
					text: `cc ${ dris }`,
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
						text: 'View',
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

/**
 * Send a Slack message about high priority closed issues impacting a lot of customers,
 * to remind Automatticians to update customers.
 *
 * @param payload - Issue event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function replyToCustomersReminder(
	payload: IssuesEvent,
	octokit: OctokitClient
): Promise< void > {
	const { issue, repository } = payload;
	const { number } = issue;
	const { full_name, owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const channel = getInput( 'slack_he_triage_channel' );
	if ( ! channel ) {
		setFailed(
			`reply-to-customers-reminder: Input slack_he_triage_channel is required but missing. Aborting.`
		);
		return;
	}

	// Check if the issue has a "High" or "BLOCKER" priority.
	const isHighPriorityIssue = await hasHighPriorityLabel( octokit, ownerLogin, repo, number );
	if ( ! isHighPriorityIssue ) {
		debug(
			`reply-to-customers-reminder: #${ number } is not labeled as a high priority issue. Aborting.`
		);
		return;
	}

	// Check if the issue has a comment with a list of support references,
	// and more than a certain number of support references listed there
	// (amount specified with reply_to_customers_threshold input).
	const issueComments = await getComments( octokit, ownerLogin, repo, number );
	const isWidelySpreadIssue = await hasManySupportReferences( issueComments );
	if ( ! isWidelySpreadIssue ) {
		debug(
			`reply-to-customers-reminder: #${ number } does not have enough support references to trigger an alert. Aborting.`
		);
		return;
	}

	debug( `reply-to-customers-reminder: Sending in Slack message about #${ number }.` );
	const message = `This high priority issue was recently closed. It is now time to send follow-up replies to all impacted customers.
${
	full_name.match( /^Automattic\/(jetpack|themes)$/i )
		? `

Before you send follow-up replies, you'll want to make sure the fix has been deployed to all customers. Check the Pull Request that closed the issue to see when the fix will be deployed to customers.`
		: ''
}`;

	const slackMessageFormat = formatSlackMessage( payload, channel, message );
	await sendSlackMessage( message, channel, payload, slackMessageFormat );
}

export default replyToCustomersReminder;
