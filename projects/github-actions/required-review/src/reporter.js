const core = require( '@actions/core' );
const github = require( '@actions/github' );
const { WError } = require( 'error' );

const STATE_ERROR = 'error';
const STATE_FAILURE = 'failure';
const STATE_PENDING = 'pending';
const STATE_SUCCESS = 'success';

/**
 * Report a status check to GitHub.
 *
 * @param {string} state - One of the `STATE_*` constants.
 * @param {string} description - Description for the status.
 */
async function status( state, description ) {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const req = {
		owner: owner,
		repo: repo,
		sha: github.context.payload.pull_request.head.sha,
		state: state,
		target_url: `https://github.com/${ owner }/${ repo }/actions/runs/${ github.context.runId }`,
		description: description,
		context: core.getInput( 'status', { required: true } ),
	};

	if ( process.env.CI ) {
		await octokit.rest.repos.createCommitStatus( req );
	} else {
		// eslint-disable-next-line no-console
		console.dir( req );
	}
}

/**
 * Error class for friendly GitHub Action error reporting.
 *
 * Use it like
 * ```
 * throw ReportError.create( 'Status description', originalError );
 * ```
 */
class ReportError extends WError {}

module.exports = {
	STATE_ERROR: STATE_ERROR,
	STATE_FAILURE: STATE_FAILURE,
	STATE_PENDING: STATE_PENDING,
	STATE_SUCCESS: STATE_SUCCESS,
	status: status,
	ReportError: ReportError,
};
module.exports.default = module.exports;
