const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

/**
 * Fetch Username based on @user
 *
 * @param {string} user - @ followed by a GitHub user name.
 */
async function getUsername( user ) {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	try {
		const res = await octokit.rest.users.getByUsername( { username: user.slice( 1 ) } );
		return res.data.login;
	} catch ( error ) {
		throw new WError(
			// prettier-ignore
			`Failed to query user ${ user } from GitHub: ${ error.response?.data?.message || error.message }`,
			error,
			{}
		);
	}
}

module.exports = getUsername;
