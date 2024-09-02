/* global GitHub */
const debug = require( '../debug' );

// Cache for getLabels.
const cache = {};

/**
 * Get all the labels available in the repo.
 *
 * @param {GitHub}        octokit - Initialized Octokit REST client.
 * @param {string}        owner   - Repository owner.
 * @param {string}        repo    - Repository name.
 * @param {RegExp|string} filter  - Optionally filter to only return a subset of labels. Use a regex pattern.
 * @return {Promise<Array>} Promise resolving to an array of all labels in the repo.
 */
async function getAvailableLabels( octokit, owner, repo, filter = '' ) {
	let labelList;
	const cacheKey = `${ owner }/${ repo }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-all-labels: Using list of labels for ${ cacheKey } from cache.` );
		labelList = cache[ cacheKey ];
	} else {
		debug( `get-all-labels: Get list of labels for ${ cacheKey }.` );
		labelList = [];
		for await ( const response of octokit.paginate.iterator(
			octokit.rest.issues.listLabelsForRepo,
			{
				owner,
				repo,
				per_page: 100,
			}
		) ) {
			for ( const label of response.data ) {
				labelList.push( label );
			}
		}
		cache[ cacheKey ] = labelList;
	}

	return filter ? labelList.filter( label => label.name.match( filter ) ) : labelList;
}

module.exports = getAvailableLabels;
