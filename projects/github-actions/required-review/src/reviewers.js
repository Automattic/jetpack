const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

/**
 * Fetch the reviewers approving the current PR.
 *
 * @returns {string[]} Reviewers.
 */
async function fetchReviewers() {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const pr = github.context.payload.pull_request.number;

	const reviewers = new Set();
	try {
		for await ( const res of octokit.paginate.iterator( octokit.rest.pulls.listReviews, {
			owner: owner,
			repo: repo,
			pull_number: pr,
			per_page: 100,
		} ) ) {
			res.data.forEach( review => {
				// GitHub may return more than one review per user, but only counts the last non-comment one for each.
				// "APPROVED" allows merging, while "CHANGES_REQUESTED" and "DISMISSED" do not.
				if ( review.state === 'APPROVED' ) {
					reviewers.add( review.user.login );
				} else if ( review.state === 'CHANGES_REQUESTED' || review.state === 'DISMISSED' ) {
					reviewers.delete( review.user.login );
				}
			} );
		}
	} catch ( error ) {
		throw new WError(
			`Failed to query ${ owner }/${ repo } PR #${ pr } reviewers from GitHub`,
			error,
			{}
		);
	}

	return [ ...reviewers ].sort();
}

module.exports = fetchReviewers;
