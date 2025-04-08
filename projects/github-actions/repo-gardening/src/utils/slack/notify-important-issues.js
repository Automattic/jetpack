const debug = require( '../debug' );
const getLabels = require( '../labels/get-labels' );
const formatSlackMessage = require( './format-slack-message' );
const sendSlackMessage = require( './send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for a label showing that it was already escalated.
 * The label name changes based on the team that was warned.
 *
 * @param {GitHub} octokit        - Initialized Octokit REST client.
 * @param {string} owner          - Repository owner.
 * @param {string} repo           - Repository name.
 * @param {string} number         - Issue number.
 * @param {string} escalatedLabel - Label used to escalate the issue.
 * @return {Promise<boolean>} Promise resolving to boolean.
 */
async function hasEscalatedLabel( octokit, owner, repo, number, escalatedLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	return labels.includes( escalatedLabel );
}

/**
 * Send a Slack Notification if the issue is important.
 *
 * We define an important issue when meeting all of the following criteria:
 * - A bug (includes a "[Type] Bug" label, or a "[Type] Bug" label is added to the issue right now)
 * - The issue is still opened
 * - The issue is not escalated yet (no label indicating that it was previously escalated to that team)
 * - The issue is either a high priority or a blocker (inferred from the existing labels or from the issue body)
 * - The issue is not already set to another priority label (no "[Pri] High", "[Pri] BLOCKER", or "[Pri] TBD" label)
 *
 * @param {GitHub}              octokit    - Initialized Octokit REST client.
 * @param {WebhookPayloadIssue} payload    - Issue event payload.
 * @param {string}              channel    - Slack channel ID to send the message to.
 * @param {string}              recipients - Name of the group getting the notification. Can be 'devs' (default) or 'product-ambassadors'.
 */
async function notifyImportantIssues( octokit, payload, channel, recipients = 'devs' ) {
	const {
		issue: { number },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	const escalatedLabel =
		recipients === 'devs'
			? '[Status] Priority Review Triggered'
			: '[Status] Escalated to Product Ambassadors';

	const isEscalated = await hasEscalatedLabel( octokit, ownerLogin, name, number, escalatedLabel );

	if ( ! isEscalated ) {
		const message = `New high-priority bug! Please check the priority.`;
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, payload, slackMessageFormat );

		debug(
			`notify-important-issues: Adding a label to issue #${ number } to show that ${ recipients } were warned.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ escalatedLabel ],
		} );
	} else {
		debug( `notify-important-issues: ${ recipients } have already been warned about ${ number }.` );
	}
}

module.exports = notifyImportantIssues;
