const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Extract the type of the issue, based of the the "[Type]" labels found in that issue.
 * If multiple Type labels can be found in the issue, we cannot extract a specific type.
 * We will consequently return an empty string.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @return {Promise<string>} Promise resolving to a string, the type of the issue, extracted from the label.
 */
async function getIssueType( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// Extract type labels, and return them all in a new array, but without the [Type] prefix.
	const typeLabels = labels
		.filter( label => label.startsWith( '[Type]' ) )
		.map( label => label.replace( '[Type] ', '' ) );

	// If there are multiple types defined in the issue, we cannot extract a specific type.
	// We will consequently return an empty string.
	if ( typeLabels.length !== 1 ) {
		return '';
	}

	return typeLabels[ 0 ];
}

module.exports = getIssueType;
