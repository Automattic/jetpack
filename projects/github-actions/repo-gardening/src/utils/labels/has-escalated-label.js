const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Check for a label showing that it was already escalated.
 * The label name changes based on the team that was warned.
 *
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit        - Initialized Octokit REST client.
 * @param {string} owner          - Repository owner.
 * @param {string} repo           - Repository name.
 * @param {string} number         - Issue number.
 * @param {string} action         - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel     - Label that was added to the issue.
 * @param {string} escalatedLabel - Label used to escalate the issue.
 * @return {Promise<boolean>} Promise resolving to boolean.
 */
async function hasEscalatedLabel(
	octokit,
	owner,
	repo,
	number,
	action,
	eventLabel,
	escalatedLabel
) {
	// Check for an exisiting label first.
	const labels = await getLabels( octokit, owner, repo, number );
	if ( labels.includes( escalatedLabel ) ) {
		return true;
	}

	// If the issue is being labeled, check if the new label is the escalation label.
	if ( 'labeled' === action && eventLabel.name && eventLabel.name === escalatedLabel ) {
		return true;
	}
}

module.exports = hasEscalatedLabel;
