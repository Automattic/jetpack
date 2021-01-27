/* global GitHub */

/**
 * Get labels on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<Array>} Promise resolving to an array of all labels for that PR.
 */
async function getLabels( octokit, owner, repo, number ) {
	const labelList = [];

	const labels = octokit.issues.listLabelsOnIssue( {
		owner: owner.login,
		repo,
		issue_number: +number,
	} );

	const responses = octokit.paginate.iterator( labels );
	for await ( const response of responses ) {
		labelList.push( response.data.name );
	}

	return labelList;
}

module.exports = getLabels;
