const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Check for Priority labels on an issue.
 * It could be existing labels,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<Array>} Promise resolving to an array of Priority labels.
 */
async function hasPriorityLabels( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name && eventLabel.name.match( /^\[Pri\].*$/ ) ) {
		labels.push( eventLabel.name );
	}

	return labels.filter( label => label.match( /^\[Pri\].*$/ ) && label !== '[Pri] TBD' );
}

module.exports = hasPriorityLabels;
