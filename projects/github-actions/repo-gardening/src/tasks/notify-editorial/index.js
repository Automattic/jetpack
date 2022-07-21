const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check for an Copy Review status label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsCopyReviewLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Copy Review label.
	return labels.includes( '[Status] Needs Copy Review' );
}

/**
 * Check for a Needs Copy label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsCopyLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Copy label.
	return labels.includes( '[Status] Needs Copy' );
}

/**
 * Check for an Editorial Input Requested label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasEditorialInputRequestedLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Editorial Input Requested label.
	return labels.includes( '[Status] Editorial Input Requested' );
}

/**
 * Send a Slack notification about a label to the Editorial team.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function notifyEditorial( payload, octokit ) {
	const { number, repository } = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( `notify-editorial: Input slack_token is required but missing. Aborting.` );
		return;
	}

	const channel = getInput( 'slack_editorial_channel' );
	if ( ! channel ) {
		setFailed(
			`notify-editorial: Input slack_editorial_channel is required but missing. Aborting.`
		);
		return;
	}

	// Check if editorial input was already requested for that PR.
	const hasBeenRequested = await hasEditorialInputRequestedLabel(
		octokit,
		ownerLogin,
		repo,
		number
	);
	if ( hasBeenRequested ) {
		debug(
			`notify-editorial: Editorial input was already requested for PR #${ number }. Aborting.`
		);
		return;
	}

	// Check for a Needs Copy Review label.
	const isLabeledForCopy = await hasNeedsCopyLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForCopy ) {
		debug(
			`notify-editorial: Found a Needs Copy label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone would be interested in input from the Editorial team on this topic.`,
			channel,
			slackToken,
			payload
		);
	}

	// Check for a Needs Copy Review label.
	const isLabeledForReview = await hasNeedsCopyReviewLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForReview ) {
		debug(
			`notify-editorial: Found a Needs Copy Review label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone is looking for a review from the Editorial team.`,
			channel,
			slackToken,
			payload
		);
	}

	if ( isLabeledForCopy || isLabeledForReview ) {
		debug(
			`notify-editorial: Adding a label to PR #${ number } to show that design input was requested.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			labels: [ '[Status] Editorial Input Requested' ],
		} );
	}
}

module.exports = notifyEditorial;
