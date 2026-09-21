// The server read-modify-writes one option for active modules and another for active
// plugins, so two requests in flight can each drop the other's change. Send one at a time.
let pendingActivation: Promise< unknown > = Promise.resolve();

// How long a caller waits before being told the request has not answered. The request
// itself keeps going, and the queue keeps waiting for it. Installs are the slow case and
// finish well inside this.
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
	let abandoned = false;

	// Told to give up before its turn came, this request never goes out at all, so the
	// error its caller was shown stays true. One already in flight cannot be recalled.
	const run = () =>
		abandoned
			? Promise.reject( new Error( 'The request was abandoned before it was sent.' ) )
			: request();

	const settled = pendingActivation.then( run, run );

	// The queue waits on the request itself, never on the timeout: giving up waiting does
	// not stop the server writing, so releasing the next request on a timeout would put
	// two of them in flight — the thing this module exists to prevent.
	pendingActivation = settled.catch( () => undefined );

	return withTimeout( settled ).catch( ( error: Error ) => {
		abandoned = true;
		throw error;
	} );
}
