const github = require( '@actions/github' );
const extras = require( './extra-context' );

/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new github.getOctokit( token );

	const { runId } = github.context;
	const { repository } = extras;
	const repo = repository.split( '/' );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: repo[ 0 ],
		repo: repo[ 1 ],
		run_id: runId,
	} );

	// Get unique list of conclusions of completed jobs
	const conclusions = [
		...new Set(
			response.data.jobs.filter( job => job.status === 'completed' ).map( job => job.conclusion )
		),
	];

	// Decide if any we'll treat this run as failed
	return !! conclusions.some( conclusion => conclusion !== 'success' );
}

/**
 * Creates and returns a run url
 *
 * @param {boolean} withAttempt - whether to include the run attempt in the url
 * @returns {string} the run url
 */
function getRunUrl( withAttempt = true ) {
	const { serverUrl, runId } = github.context;
	const { repository, runAttempt } = extras;
	return `${ serverUrl }/${ repository }/actions/runs/${ runId }/${
		withAttempt ? `attempts/${ runAttempt }` : ''
	}`;
}

module.exports = { isWorkflowFailed, getRunUrl };
