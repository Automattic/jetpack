const debug = require( './debug' );

/* global WPAutomationTask */

/**
 * Higher-order function which executes and returns the result of the given
 * handler only if the PR is not currently closed.
 *
 * @param {WPAutomationTask} handler - Original task.
 * @returns {WPAutomationTask} Enhanced task.
 */
function ifNotClosed( handler ) {
	const newHandler = ( payload, octokit ) => {
		if ( payload.pull_request.state !== 'closed' ) {
			return handler( payload, octokit );
		}
		debug( `main: Skipping ${ handler.name } because the PR is closed.` );
	};
	Object.defineProperty( newHandler, 'name', { value: handler.name } );
	return newHandler;
}

module.exports = ifNotClosed;
