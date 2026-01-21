/* global GitHub */
const debug = require( './debug' );

// Cache for getDiff.
const cache = {};

/**
 * Get the diff for a PR.
 *
 * Filters out lines longer than 500 characters (likely minified code)
 * and truncates the result to maxSize characters.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {number} number  - PR number.
 * @param {number} maxSize - Maximum size of diff to return (default 50000 characters).
 * @return {Promise<string>} Promise resolving to the PR diff as a string, truncated to maxSize.
 */
async function getDiff( octokit, owner, repo, number, maxSize = 50000 ) {
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-diff: Returning diff for ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-diff: Fetching diff for ${ cacheKey }.` );

	const response = await octokit.rest.pulls.get( {
		owner,
		repo,
		pull_number: +number,
		mediaType: {
			format: 'diff',
		},
	} );

	let diff = response.data;

	if ( typeof diff !== 'string' ) {
		debug( `get-diff: Expected diff to be a string but received ${ typeof diff }. Returning empty diff.` );
		diff = '';
	}
	// Filter out lines longer than 500 characters (likely minified code).
	diff = diff
		.split( '\n' )
		.filter( line => line.length <= 500 )
		.join( '\n' );

	// Truncate if too large.
	if ( diff.length > maxSize ) {
		debug( `get-diff: Truncating diff from ${ diff.length } to ${ maxSize } characters.` );
		diff = diff.substring( 0, maxSize );
	}

	cache[ cacheKey ] = diff;
	return diff;
}

module.exports = getDiff;
