import debug from './debug.js';
import type { OctokitClient, PullRequestPayload } from '../types.js';

type PullRequestTask = (
	payload: PullRequestPayload,
	octokit: OctokitClient
) => Promise< void > | void;

/**
 * Higher-order function which executes and returns the result of the given
 * handler only if the PR is not currently closed.
 *
 * @param handler - Original task.
 * @return Enhanced task.
 */
function ifNotClosed( handler: PullRequestTask ): PullRequestTask {
	const newHandler = (
		payload: PullRequestPayload,
		octokit: OctokitClient
	): Promise< void > | void => {
		if ( payload.pull_request.state !== 'closed' ) {
			return handler( payload, octokit );
		}
		debug( `main: Skipping ${ handler.name } because the PR is closed.` );
	};
	Object.defineProperty( newHandler, 'name', { value: handler.name } );
	return newHandler;
}

export default ifNotClosed;
