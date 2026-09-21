// The server read-modify-writes one option for active modules and another for active
// plugins, so two requests in flight can each drop the other's change. Send one at a time.
let pendingActivation: Promise< unknown > = Promise.resolve();

// A request that never settles would hold the queue for the life of the page, leaving every
// later switch inert. Installs are the slow case and finish well inside this.
const QUEUE_TIMEOUT_MS = 90_000;

/**
 * Settle with the request, or give up waiting for it so the queue keeps moving.
 *
 * @param request - The request to bound.
 * @return The request's result.
 */
function withTimeout< T >( request: Promise< T > ): Promise< T > {
	let timer: ReturnType< typeof setTimeout >;

	const expiry = new Promise< never >( ( _resolve, reject ) => {
		timer = setTimeout(
			() => reject( new Error( 'The request took too long to complete.' ) ),
			QUEUE_TIMEOUT_MS
		);
	} );

	return Promise.race( [ request, expiry ] ).finally( () => clearTimeout( timer ) ) as Promise< T >;
}

/**
 * Run an activation request once every request queued before it has settled.
 *
 * @param request - The request to run.
 * @return The request's result.
 */
export function queueActivationRequest< T >( request: () => Promise< T > ): Promise< T > {
	const run = pendingActivation.then(
		() => withTimeout( request() ),
		() => withTimeout( request() )
	);
	pendingActivation = run.catch( () => undefined );

	return run;
}
