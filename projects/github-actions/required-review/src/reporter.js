import * as core from '@actions/core';
import * as github from '@actions/github';
import { WError } from 'error';

export const STATE_ERROR = 'error';
export const STATE_FAILURE = 'failure';
export const STATE_PENDING = 'pending';
export const STATE_SUCCESS = 'success';

/**
 * Report a status check to GitHub.
 *
 * @param {string} state       - One of the `STATE_*` constants.
 * @param {string} description - Description for the status.
 */
export async function status( state, description ) {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const req = {
		owner: owner,
		repo: repo,
		sha: github.context.payload.pull_request.head.sha,
		state: state,
		target_url: `${ github.context.serverUrl }/${ owner }/${ repo }/actions/runs/${ github.context.runId }`,
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
export class ReportError extends WError {}
