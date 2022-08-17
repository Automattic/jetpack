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
	const {
		context: { eventName, sha, ref_type, ref_name, payload },
	} = github;
	let event = sha;

	if ( eventName === 'pull_request' ) {
		const { html_url, number, title } = payload.pull_request;
		event = `PR <${ html_url }|${ number }: ${ title }>`;
	}

	if ( eventName === 'push' ) {
		const { url, id } = payload.head_commit;
		event = `commit <${ url }|${ id }> on ${ ref_type } *${ ref_name }*`;
	}

	if ( eventName === 'schedule' ) {
		event = `scheduled run on ${ ref_type } *${ ref_name }*`;
	}

	return `Tests ${ isFailure ? 'failed' : 'passed' } for ${ event }`;
}

module.exports = { isWorkflowFailed, getNotificationText };
