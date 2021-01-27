const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

const cache = {};

/**
 * Fetch the members of a team.
 *
 * @param {string} team - GitHub team slug.
 * @returns {string[]} Team members.
 */
async function fetchTeamMembers( team ) {
	if ( cache[ team ] ) {
		return cache[ team ];
	}

	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const org = github.context.payload.repository.owner.login;
	const per_page = 100;

	let members = [];
	let page = 0;
	let res;
	do {
		try {
			res = await octokit.teams.listMembersInOrg( {
				org: org,
				team_slug: team,
				per_page: per_page,
				page: ++page,
			} );
			members = members.concat( res.data.map( v => v.login ) );
		} catch ( error ) {
			throw new WError( `Failed to query ${ org } team ${ team } from GitHub`, error, {} );
		}
	} while ( res.data.length === per_page );

	cache[ team ] = members;
	return members;
}

module.exports = fetchTeamMembers;
