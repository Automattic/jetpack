const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

/**
 * Fetch the paths in the current PR.
 *
 * @returns {string[]} Paths.
 */
async function fetchPaths() {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const pr = github.context.payload.pull_request.number;
	const per_page = 100;

	const paths = {};
	let page = 0;
	let res;
	do {
		try {
			res = await octokit.pulls.listFiles( {
				owner: owner,
				repo: repo,
				pull_number: pr,
				per_page: per_page,
				page: ++page,
			} );
			res.data.forEach( file => {
				paths[ file.filename ] = true;
				if ( file.previous_filename ) {
					paths[ file.previous_filename ] = true;
				}
			} );
		} catch ( error ) {
			throw new WError(
				`Failed to query ${ owner }/${ repo } PR #${ pr } files from GitHub`,
				error,
				{}
			);
		}
	} while ( res.data.length === per_page );

	return Object.keys( paths ).sort();
}

module.exports = fetchPaths;
