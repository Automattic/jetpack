const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for a high priority label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasHighPrioLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the [Pri] High label.
	return labels.includes( '[Pri] High' );
}

/**
 * Check for a BLOCKER priority label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasBlockerPrioLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the [Pri] BLOCKER label.
	return labels.includes( '[Pri] BLOCKER' );
}

/**
 * Check for a Kitkat Input Requested label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasKitkatSignalLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Escalated to Kitkat label.
	return labels.includes( '[Status] Escalated to Kitkat' );
}

/**
 * Send a Slack notification about a label to Team KitKat.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function notifyKitKat( payload, octokit ) {
	const { number, repository } = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( 'notify-kitkat: Input slack_token is required but missing. Aborting.' );
		return;
	}

	const channel = getInput( 'slack_kitkat_channel' );
	if ( ! channel ) {
		setFailed( 'notify-kitkat: Input slack_kitkat_channel is required but missing. Aborting.' );
		return;
	}

	// Check if Kitkat input was already requested for that issue.
	const hasBeenRequested = await hasKitkatSignalLabel( octokit, ownerLogin, repo, number );
	if ( hasBeenRequested ) {
		debug( `notify-kitkat: Kitkat input was already requested for issue #${ number }. Aborting.` );
		return;
	}

	// Check for a [Pri] High label.
	const isLabeledHighPriority = await hasHighPrioLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledHighPriority ) {
		debug(
			`notify-kitkat: Found a [Pri] High label on issue #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			'New High priority bug! Please take a moment to triage this bug.',
			channel,
			slackToken,
			payload
		);
	}

	// Check for a BLOCKER priority label.
	const isLabeledBlocker = await hasBlockerPrioLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledBlocker ) {
		debug(
			`notify-kitkat: Found a [Pri] BLOCKER label on issue #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			'New Blocker bug!  Please take a moment to triage this bug.',
			channel,
			slackToken,
			payload
		);
	}

	if ( isLabeledHighPriority || isLabeledBlocker ) {
		debug( `notify-kitkat: Adding a label to issue #${ number } to show that Kitkat was warned.` );
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			labels: [ '[Status] Escalated to Kitkat' ],
		} );
	}
}

module.exports = notifyKitKat;
