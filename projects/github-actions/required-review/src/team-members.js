const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

const cache = {};

/**
 * Fetch the members of a team for the purpose of verifying a review Requirement.
 * Special case: Names prefixed with @ are considered to be a one-member team with the named GitHub user.
 *
 * @param {string} team - GitHub team slug, or @ followed by a GitHub user name.
 * @returns {string[]} Team members.
 */
async function fetchTeamMembers( team ) {
	if ( cache[ team ] ) {
		return cache[ team ];
	}

	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const org = github.context.payload.repository.owner.login;

	let members = [];
	if ( team.startsWith( '@' ) ) {
		// Handle @singleuser virtual teams. Fetch the correct username case from GitHub
		// to avoid having to worry about edge cases and Unicode versions and such.
		try {
			const res = await octokit.rest.users.getByUsername( { username: team.slice( 1 ) } );
			members.push( res.data.login );
		} catch ( error ) {
			throw new WError(
				// prettier-ignore
				`Failed to query user ${ team } from GitHub: ${ error.response?.data?.message || error.message }`,
				error,
				{}
			);
		}
	} else {
		try {
			for await ( const res of octokit.paginate.iterator( octokit.rest.teams.listMembersInOrg, {
				org: org,
				team_slug: team,
				per_page: 100,
			} ) ) {
				members = members.concat( res.data.map( v => v.login ) );
			}
		} catch ( error ) {
			throw new WError(
				// prettier-ignore
				`Failed to query ${ org } team ${ team } from GitHub: ${ error.response?.data?.message || error.message }`,
				error,
				{}
			);
		}
	}

	cache[ team ] = members;
	return members;
}

module.exports = fetchTeamMembers;
