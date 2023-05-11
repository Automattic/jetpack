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
        return res.data.login
    } catch ( error ) {
        throw new WError(
            // prettier-ignore
            `Failed to query user ${ user } from GitHub: ${ error.response?.data?.message || error.message }`,
            error,
            {}
        );
    }
}

/**
 * Request review from the given team
 *
 * @param {string} team - GitHub team slug, or @ followed by a GitHub user name.
 */
async function requestReviewer( team ) {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const pr = github.context.payload.pull_request.number;

    if ( team.startsWith( '@' ) ) {
		// Handle @singleuser virtual teams. Fetch the correct username case from GitHub
		// to avoid having to worry about edge cases and Unicode versions and such.
        try {
            const login = await getUsername(team);
            core.info(`Requesting review from "${ login }"`)
            await octokit.rest.pulls.requestReviewers({
                owner: owner,
                repo: repo,
                pull_number: pr,
                reviewers: [ login ]
            })
        } catch (err) {
            throw new Error(`Unable to request review.\n  Error: ${err}`)
        }
	} else { 
        try {
            core.info(`Requesting review from "${ team }"`)
            await octokit.rest.pulls.requestReviewers({
                owner: owner,
                repo: repo,
                pull_number: pr,
                team_reviewers: [team]
            })
        } catch (err) {
            throw new Error(`Unable to request review.\n  Error: ${err}`)
        }
    };
}

module.exports = requestReviewer;