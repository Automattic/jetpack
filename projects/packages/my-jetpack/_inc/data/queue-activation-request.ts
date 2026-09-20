// The server read-modify-writes one option for active modules and another for active
// plugins, so two requests in flight can each drop the other's change. Send one at a time.
let pendingActivation: Promise< unknown > = Promise.resolve();

/**
 * Run an activation request once every request queued before it has settled.
 *
 * @param request - The request to run.
 * @return The request's result.
 */
export function queueActivationRequest< T >( request: () => Promise< T > ): Promise< T > {
	const run = pendingActivation.then( request, request );
	pendingActivation = run.catch( () => undefined );

	return run;
}
