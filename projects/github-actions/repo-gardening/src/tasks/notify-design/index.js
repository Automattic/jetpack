const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check for a Design Review status label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsDesignReviewLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Design Review label.
	return labels.includes( '[Status] Needs Design Review' );
}

/**
 * Check for a Needs Design label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsDesignLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Design label.
	return labels.includes( '[Status] Needs Design' );
}

/**
 * Check for a Design Input Requested label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasDesignInputRequestedLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Design Input Requested label.
	return labels.includes( '[Status] Design Input Requested' );
}

/**
 * Send a Slack notification about a label to the Design team.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function notifyDesign( payload, octokit ) {
	const { number, repository } = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( `notify-design: Input slack_token is required but missing. Aborting.` );
		return;
	}

	const channel = getInput( 'slack_design_channel' );
	if ( ! channel ) {
		setFailed( `notify-design: Input slack_design_channel is required but missing. Aborting.` );
		return;
	}

	// Check if design input was already requested for that PR.
	const hasBeenRequested = await hasDesignInputRequestedLabel( octokit, ownerLogin, repo, number );
	if ( hasBeenRequested ) {
		debug( `notify-design: Design input was already requested for PR #${ number }. Aborting.` );
		return;
	}

	// Check for a Needs Design Review label.
	const isLabeledForDesign = await hasNeedsDesignLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForDesign ) {
		debug(
			`notify-design: Found a Needs Design label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone would be interested in input from the Design team on this topic.`,
			channel,
			slackToken,
			payload
		);
	}

	// Check for a Needs Design label.
	const isLabeledForReview = await hasNeedsDesignReviewLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForReview ) {
		debug(
			`notify-design: Found a Needs Design Review label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone is looking for a review from the design team.`,
			channel,
			slackToken,
			payload
		);
	}

	if ( isLabeledForDesign || isLabeledForReview ) {
		debug(
			`notify-design: Adding a label to PR #${ number } to show that design input was requested.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			labels: [ '[Status] Design Input Requested' ],
		} );
	}
}

module.exports = notifyDesign;
