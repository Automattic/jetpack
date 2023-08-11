/* global GitHub */
const debug = require( './debug' );

// Cache for getLabels.
const cache = {};

/**
 * Get labels on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<Array>} Promise resolving to an array of all labels for that PR.
 */
async function getLabels( octokit, owner, repo, number ) {
	const labelList = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-labels: Returning list of lables on ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-labels: Get list of labels on ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listLabelsOnIssue, {
		owner,
		repo,
		issue_number: +number,
		per_page: 100,
	} ) ) {
		response.data.map( label => {
			labelList.push( label.name );
		} );
	}

	cache[ cacheKey ] = labelList;
	return labelList;
}

module.exports = getLabels;
