// Cache for getCheckComments.
const cache = {};

/**
 * Get a list of all test reminder comments in an issue.
 *
 * @param {github} github               - Pre-authenticated octokit/rest.js client with pagination plugins.
 * @param {string} owner                - Repository owner.
 * @param {string} repo                 - Repository name.
 * @param {string} number               - Issue number.
 * @param {string} testCommentIndicator - A piece of text unique to all test reminder comments.
 * @param {core}   core                 - A reference to the @actions/core package
 * @returns {Promise<Array>} Promise resolving to an array of comment IDs.
 */
async function getCheckComments( github, owner, repo, number, testCommentIndicator, core ) {
	const testCommentIDs = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		core.debug(
			`get-comments: Returning list of all test reminder comments on ${ cacheKey } from cache.`
		);
		return cache[ cacheKey ];
	}

	core.debug( `get-comments: Get list of all test reminder comments on ${ cacheKey }.` );

	for await ( const response of github.paginate.iterator( github.rest.issues.listComments, {
		owner,
		repo,
		issue_number: +number,
		per_page: 100,
	} ) ) {
		response.data.map( comment => {
			if ( comment.body.includes( testCommentIndicator ) ) {
				testCommentIDs.push( comment.id );
			}
		} );
	}

	cache[ cacheKey ] = testCommentIDs;

	core.debug(
		`get-comments: Cached list of all test reminder comments on ${ cacheKey }: ${ testCommentIDs.join(
			', '
		) }.`
	);

	return testCommentIDs;
}

module.exports = getCheckComments;
