const github = require( '@actions/github' );

/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new github.getOctokit( token );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: github.context.payload.repository.owner.login,
		repo: github.context.payload.repository.name,
		run_id: github.context.runId,
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
 * Creates the notification message text
 *
 * @param {boolean} isFailure - whether the workflow is failed or not
 */
async function getNotificationText( isFailure ) {
	let event = github.context.sha;

	if ( github.context.eventName === 'pull_request' ) {
		const { html_url, number, title } = github.context.payload.pull_request;
		event = `PR <${ html_url }|${ number }: ${ title }>`;
	}
	if ( github.context.eventName === 'push' || github.context.eventName === 'schedule' ) {
		const { url, id } = github.context.payload.head_commit;
		event = `commit <${ url }|${ id }> on branch *${ github.context.ref.substring( 11 ) }*`;
	}
	return `Tests ${ isFailure ? 'failed' : 'passed' } for ${ event }`;
}

module.exports = { isWorkflowFailed, getNotificationText };
