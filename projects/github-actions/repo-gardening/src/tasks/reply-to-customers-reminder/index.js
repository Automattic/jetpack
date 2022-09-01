const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getComments = require( '../../utils/get-comments' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for a High or Blocker Priority label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasHighPriorityLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	return labels.some( label => label === '[Pri] High' || label === '[Pri] BLOCKER' );
}

/**
 * Check if the issue has a comment with a list of support references,
 * and at least x support references listed there.
 * (x is specified with reply_to_customers_threshold input, default to 10).
 * We only count the number of unanswered support references, since they're the ones we'll need to contact.
 *
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasManySupportReferences( issueComments ) {
	const referencesThreshhold = getInput( 'reply_to_customers_threshold' );

	let isWidelySpreadIssue = false;
	issueComments.map( comment => {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Support References**' )
		) {
			// Count the number of to-do items in the comment.
			const countReferences = comment.body.split( '- [ ] ' ).length - 1;
			if ( countReferences >= parseInt( referencesThreshhold ) ) {
				isWidelySpreadIssue = true;
			}
		}
	} );

	return isWidelySpreadIssue;
}

/**
 * Build an object containing the slack message and its formatting to send to Slack.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {string}              channel - Slack channel ID.
 * @param {string}              message - Basic message (without the formatting).
 * @returns {Object} Object containing the slack message and its formatting.
 */
function formatSlackMessage( payload, channel, message ) {
	const { issue, repository } = payload;
	const { html_url, title } = issue;

	let dris = '@bug_herders';
	switch ( repository.full_name ) {
		case 'Automattic/jetpack':
			dris = '@jpop-da';
			break;
		case 'Automattic/zero-bs-crm':
		case 'Automattic/sensei':
		case 'Automattic/WP-Job-Manager':
			dris = '@heysatellite';
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
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function replyToCustomersReminder( payload, octokit ) {
	const { issue, repository } = payload;
	const { number } = issue;
	const { full_name, owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed(
			`reply-to-customers-reminder: Input slack_token is required but missing. Aborting.`
		);
		return;
	}

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
	full_name.match( /^Automattic\/(jetpack|zero-bs-crm|themes)$/i )
		? `

Before you send follow-up replies, you'll want to make sure the fix has been deployed to all customers. Check the Pull Request that closed the issue to see when the fix will be deployed to customers.`
		: ''
}`;

	const slackMessageFormat = formatSlackMessage( payload, channel, message );
	await sendSlackMessage( message, channel, slackToken, payload, slackMessageFormat );
}

module.exports = replyToCustomersReminder;
