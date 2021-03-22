/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );
const sendSlackMessage = require( '../../send-slack-message' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check for a Design Review status label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasDesignReviewLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Design Review label.
	return !! labels.find( label => label.match( /^\[Status\]\sNeeds\sDesign\sReview$/ ) );
}

/**
 * Check for a Needs Design label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsDesignLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Design label.
	return !! labels.find( label => label.match( /^\[Status\]\sNeeds\sDesign$/ ) );
}

/**
 * Check for a Design Input Requested label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasInputRequestedLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Design Input Requested label.
	return !! labels.find( label => label.match( /^\[Status\]\sDesign\sInput\sRequested$/ ) );
}

/**
 * Send a Slack notification about a label to the Design team.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 * @param {object}                    extraTokens - List of extra tokens passed to the task, including Slack tokens.
 */
async function notifyDesign( payload, octokit, extraTokens ) {
	const { number, repository } = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;
	const { slack_design_channel: channel, slack_token } = extraTokens;

	// Check if design input was already requested for that PR.
	const hasBeenRequested = await hasInputRequestedLabel( octokit, ownerLogin, repo, number );
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
			slack_token,
			payload
		);
	}

	// Check for a Needs Design label.
	const isLabeledForReview = await hasDesignReviewLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForReview ) {
		debug(
			`notify-design: Found a Needs Design Review label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone is looking for a review from the design team.`,
			channel,
			slack_token,
			payload
		);
	}

	debug(
		`notify-design: Adding a label to PR #${ number } to show that design input was requested.`
	);
	await octokit.issues.addLabels( {
		owner: ownerLogin,
		repo,
		issue_number: number,
		labels: [ '[Status] Design Input Requested' ],
	} );
}

module.exports = notifyDesign;
