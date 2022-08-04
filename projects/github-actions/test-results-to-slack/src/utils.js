const { context, getOctokit } = require( '@actions/github' );

/**
 * Decides if the current workflow failed
 *
 * @param {string} token - GitHub token
 */
async function isWorkflowFailed( token ) {
	// eslint-disable-next-line new-cap
	const octokit = new getOctokit( token );

	// Get the list of jobs for the current workflow run
	const response = await octokit.rest.actions.listJobsForWorkflowRun( {
		owner: context.payload.repository.owner.login,
		repo: context.payload.repository.name,
		run_id: context.runId,
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
 * @param isFailure
 */
async function getNotificationText( isFailure ) {
	let event = context.sha;
	console.log( context );
	if ( context.eventName === 'pull_request' ) {
		const { pull_request } = context.payload;
		event = `PR <${ pull_request.html_url }|${ pull_request.number }: ${ pull_request.title }>`;
	}
	if ( context.eventName === 'push' ) {
		event = `commit <${ context.payload.head_commit.url }|${
			context.sha
		}> on branch *${ context.ref.substring( 11 ) }*`;
	}
	const text = `Tests ${ isFailure ? 'failed' : 'passed' } for ${ event }`;
	console.log( text );
	return text;
}

module.exports = { isWorkflowFailed, getNotificationText };
