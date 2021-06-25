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

	let members = [];
	try {
		for await ( const res of octokit.paginate.iterator( octokit.rest.teams.listMembersInOrg, {
			org: org,
			team_slug: team,
			per_page: 100,
		} ) ) {
			members = members.concat( res.data.map( v => v.login ) );
		}
	} catch ( error ) {
		throw new WError( `Failed to query ${ org } team ${ team } from GitHub`, error, {} );
	}

	cache[ team ] = members;
	return members;
}

module.exports = fetchTeamMembers;
