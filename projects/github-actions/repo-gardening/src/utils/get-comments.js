/* global GitHub */
const debug = require( './debug' );

// Cache for getComments.
const cache = {};

/**
 * Get all comments belonging to an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<Array>} Promise resolving to an array of all comments on that given issue.
 */
async function getComments( octokit, owner, repo, number ) {
	const issueComments = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-comments: Returning list of all comments on ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-comments: Get list of all comments on ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listComments, {
		owner,
		repo,
		issue_number: +number,
		per_page: 100,
	} ) ) {
		response.data.map( comment => {
			issueComments.push( comment );
		} );
	}

	cache[ cacheKey ] = issueComments;
	return issueComments;
}

module.exports = getComments;
