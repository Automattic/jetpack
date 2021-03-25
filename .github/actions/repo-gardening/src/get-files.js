/* global GitHub */
const debug = require( './debug' );

/**
 * Get list of files modified in PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<Array>} Promise resolving to an array of all files modified in  that PR.
 */
async function getFiles( octokit, owner, repo, number ) {
	const fileList = [];

	debug( 'add-labels: Get list of files modified in this PR.' );

	for await ( const response of octokit.paginate.iterator( octokit.pulls.listFiles, {
		owner,
		repo,
		pull_number: +number,
		per_page: 100,
	} ) ) {
		response.data.map( file => {
			fileList.push( file.filename );
		} );
	}

	return fileList;
}

module.exports = getFiles;
