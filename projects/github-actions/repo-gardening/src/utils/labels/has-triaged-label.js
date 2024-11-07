const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Check if an issue has a "Triaged" label.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @return {Promise<boolean>} Promise resolving to true if the issue has a "Triaged" label.
 */
async function hasTriagedLabel( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name && eventLabel.name === 'Triaged' ) {
		labels.push( eventLabel.name );
	}

	return labels.includes( 'Triaged' );
}

module.exports = hasTriagedLabel;
