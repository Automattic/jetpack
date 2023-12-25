const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Check for a "[Status] Priority Review Triggered" label showing that it was already escalated.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasEscalatedLabel( octokit, owner, repo, number, action, eventLabel ) {
	// Check for an exisiting label first.
	const labels = await getLabels( octokit, owner, repo, number );
	if (
		labels.includes( '[Status] Priority Review Triggered' ) ||
		labels.includes( '[Status] Escalated to Kitkat' )
	) {
		return true;
	}

	// If the issue is being labeled, check if the label is "[Status] Priority Review Triggered".
	if (
		'labeled' === action &&
		eventLabel.name &&
		eventLabel.name.match( /^\[Status\] Priority Review Triggered.*$/ )
	) {
		return true;
	}
}

module.exports = hasEscalatedLabel;
