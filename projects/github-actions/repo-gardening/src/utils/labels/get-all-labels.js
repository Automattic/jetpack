/* global GitHub */
const debug = require( '../debug' );

// Cache for getLabels.
const cache = {};

/**
 * Get all the labels available in the repo.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {RegExp|string} filter  - Optionally filter to only return a subset of labels. Use a regex pattern.
 * @return {Promise<Array>} Promise resolving to an array of all labels in the repo.
 */
async function getAllLabels( octokit, owner, repo, filter = '' ) {
	const labelList = [];
	const cacheKey = `${ owner }/${ repo } #${ filter }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-all-labels: Returning list of labels for ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-all-labels: Get list of labels for ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listLabelsForRepo, {
		owner,
		repo,
		per_page: 100,
	} ) ) {
		for ( const label of response.data ) {
			if ( filter && ! label.name.match( filter ) ) {
				continue;
			}
			labelList.push( label );
		}
	}

	cache[ cacheKey ] = labelList;
	return labelList;
}

module.exports = getAllLabels;
