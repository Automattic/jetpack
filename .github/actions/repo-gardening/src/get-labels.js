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

	for await ( const response of octokit.paginate.iterator( octokit.issues.listLabelsOnIssue, {
		owner: owner.login,
		repo,
		issue_number: +number,
	} ) ) {
		response.data.map( label => {
			labelList.push( label.name );
		} );
	}

	return labelList;
}

module.exports = getLabels;
