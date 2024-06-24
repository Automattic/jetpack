const core = require( '@actions/core' );
const github = require( '@actions/github' );

/**
 * Request review from the given team
 *
 * @param {string[]} teams - GitHub team slug, or @ followed by a GitHub user name.
 */
async function requestReviewer( teams ) {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const pr = github.context.payload.pull_request.number;
	const author = `@${ github.context.payload.pull_request.user.login }`;
	if ( teams.includes( author ) ) {
		core.info( `Skipping review for author ${ author }` );
		teams = teams.filter( team => team !== author );
	}

	const userReviews = [];
	const teamReviews = [];

	for ( const t of teams ) {
		if ( t.startsWith( '@' ) ) {
			userReviews.push( t.slice( 1 ) );
		} else {
			teamReviews.push( t );
		}
	}

	try {
		await octokit.rest.pulls.requestReviewers( {
			owner: owner,
			repo: repo,
			pull_number: pr,
			reviewers: userReviews,
			team_reviewers: teamReviews,
		} );
		core.info( `Requested review(s) from ${ teams }` );
	} catch ( err ) {
		throw new Error( `Unable to request review.\n  Error: ${ err }` );
	}
}

module.exports = requestReviewer;
