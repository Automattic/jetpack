const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Ensure the issue is a bug, by looking for a "[Type] Bug" label.
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
async function isBug( octokit, owner, repo, number, action, eventLabel ) {
	// If the issue has a "[Type] Bug" label, it's a bug.
	const labels = await getLabels( octokit, owner, repo, number );
	if ( labels.includes( '[Type] Bug' ) ) {
		return true;
	}

	// Next, check if the current event was a [Type] Bug label being added.
	if ( 'labeled' === action && eventLabel.name && '[Type] Bug' === eventLabel.name ) {
		return true;
	}
}

module.exports = isBug;
