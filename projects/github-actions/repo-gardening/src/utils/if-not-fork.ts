import debug from './debug.ts';
import type { OctokitClient, PullRequestEvent } from '../types.ts';

type PullRequestTask = (
	payload: PullRequestEvent,
	octokit: OctokitClient
) => Promise< void > | void;

/**
 * Higher-order function which executes and returns the result of the given
 * handler only if the enhanced function is called with a payload indicating a
 * pull request event which did not originate from a forked repository.
 *
 * @param handler - Original task.
 * @return Enhanced task.
 */
function ifNotFork( handler: PullRequestTask ): PullRequestTask {
	const newHandler = (
		payload: PullRequestEvent,
		octokit: OctokitClient
	): Promise< void > | void => {
		if ( payload.pull_request.head.repo?.full_name === payload.pull_request.base.repo?.full_name ) {
			return handler( payload, octokit );
		}
		debug( `main: Skipping ${ handler.name } because we are in a fork.` );
	};
	Object.defineProperty( newHandler, 'name', { value: handler.name } );
	return newHandler;
}

export default ifNotFork;
