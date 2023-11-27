const debug = require( '../debug' );
const hasEscalatedLabel = require( '../labels/has-escalated-label' );
const hasPriorityLabels = require( '../labels/has-priority-labels' );
const isBug = require( '../labels/is-bug' );
const findPriority = require( '../parse-content/find-priority' );
const formatSlackMessage = require( './format-slack-message' );
const sendSlackMessage = require( './send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Send a Slack Notification if the issue is important.
 *
 * We define an important issue when meeting all of the following criteria:
 * - A bug (includes a "[Type] Bug" label, or a "[Type] Bug" label is added to the issue right now)
 * - The issue is still opened
 * - The issue is not escalated yet (no "[Status] Priority Review Triggered" label)
 * - The issue is either a high priority or a blocker (inferred from the existing labels or from the issue body)
 * - The issue is not already set to another priority label (no "[Pri] High", "[Pri] BLOCKER", or "[Pri] TBD" label)
 *
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {string}              channel - Slack channel ID to send the message to.
 */
async function notifyImportantIssues( octokit, payload, channel ) {
	const { action, issue, label = {}, repository } = payload;
	const { number, body, state } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	const isBugIssue = await isBug( octokit, ownerLogin, name, number, action, label );
	const isEscalated = await hasEscalatedLabel( octokit, ownerLogin, name, number, action, label );
	const priorityLabels = await hasPriorityLabels(
		octokit,
		ownerLogin,
		name,
		number,
		action,
		label
	);
	const priority = findPriority( body );

	const highPriorityIssue = priority === 'High' || priorityLabels.includes( '[Pri] High' );
	const blockerIssue = priority === 'BLOCKER' || priorityLabels.includes( '[Pri] BLOCKER' );

	const hasOtherPriorityLabels = priorityLabels.some( priLabel =>
		/^\[Pri\] (?!High|BLOCKER|TBD)/.test( priLabel )
	);

	if (
		isBugIssue &&
		state === 'open' &&
		! isEscalated &&
		( highPriorityIssue || blockerIssue ) &&
		! hasOtherPriorityLabels
	) {
		const message = `New ${
			highPriorityIssue ? 'High-priority' : 'Blocker'
		} bug! Please check the priority.`;
		const slackMessageFormat = formatSlackMessage( payload, channel, message );
		await sendSlackMessage( message, channel, payload, slackMessageFormat );

		debug(
			`notify-important-issues: Adding a label to issue #${ number } to show that the triage team was warned.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ '[Status] Priority Review Triggered' ],
		} );
	}
}

module.exports = notifyImportantIssues;
