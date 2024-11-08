const getLabels = require( './get-labels' );

/* global GitHub */

/**
 * Extract the type of the issue, based of the the "[Type]" labels found in that issue.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 * If multiple Type labels can be found in the issue, we cannot extract a specific type.
 * We will consequently return an empty string.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {object} eventLabel - Label that was added to the issue.
 * @return {Promise<string>} Promise resolving to a string, the type of the issue, extracted from the label.
 */
async function getIssueType( octokit, owner, repo, number, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// Create a new array with all existing labels plus the new eventLabel
	// if one was just added in the event that triggered this action.
	const issueLabels = [ ...labels, ...( eventLabel?.name ? [ eventLabel.name ] : [] ) ];

	// Extract type labels, and return them all in a new array, but without the [Type] prefix.
	const typeLabels = issueLabels
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
