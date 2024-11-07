const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Check if an issue needs to be handled by a third-party,
 * and thus cannot be fully triaged by us.
 * In practice, we look for 2 different labels:
 * "[Status] Needs 3rd Party Fix" and "[Status] Needs Core Fix"
 *
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @return {Promise<boolean>} Promise resolving to true if the issue needs a third-party fix.
 */
async function needsThirdPartyFix( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name ) {
		labels.push( eventLabel.name );
	}

	return labels.some( label => label.match( /^\[Status\] Needs (3rd Party|Core) Fix$/ ) );
}

module.exports = needsThirdPartyFix;
