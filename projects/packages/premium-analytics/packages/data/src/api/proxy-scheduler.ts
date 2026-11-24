/**
 * Internal dependencies
 */
import { getApiErrorCode } from '../utils/api-error';
import { statsProxyPath } from './constants';
import { fetchPreservingStatus } from './stats-proxy-fetch';

export type ProxyPriority = 'primary' | 'comparison';

/** Reads per batch; the route accepts up to 20. */
const BATCH_SIZE = 7;

/** Batches in flight at once, leaving two of HTTP/1.1's six connections for assets and other requests. */
const MAX_IN_FLIGHT = 4;

/** How long the first queued read waits for the rest of a render's reads to join it. */
const BATCH_WINDOW_MS = 10;

type Job = {
	path: string;
	priority: number;
	seq: number;
	signal?: AbortSignal;
	settled: boolean;
	resolve: ( value: unknown ) => void;
	reject: ( reason: unknown ) => void;
	onAbort?: () => void;
};

type BatchItemResult = { status: number; body: unknown };

const queue: Job[] = [];
let inFlight = 0;
let seq = 0;
let flushTimer: ReturnType< typeof setTimeout > | null = null;
let batchRouteMissing = false;

/**
 * Whether the page reached this origin over HTTP/1.1, where the browser caps connections per host
 * and the dashboard's reads would otherwise queue in waves. Unknown protocols don't batch.
 *
 * @return Whether local proxy reads should be batched.
 */
export function shouldBatchProxyReads(): boolean {
	if ( batchRouteMissing || typeof performance === 'undefined' || ! performance.getEntriesByType ) {
		return false;
	}
	const [ navigation ] = performance.getEntriesByType(
		'navigation'
	) as PerformanceNavigationTiming[];
	return navigation?.nextHopProtocol === 'http/1.1';
}

function abortReason( signal: AbortSignal ) {
	return signal.reason ?? new DOMException( 'Aborted', 'AbortError' );
}

function settle( job: Job, outcome: 'resolve' | 'reject', value: unknown ) {
	if ( job.settled ) {
		return;
	}
	job.settled = true;
	if ( job.onAbort ) {
		job.signal?.removeEventListener( 'abort', job.onAbort );
	}
	job[ outcome ]( value );
}

function takeNext(): Job {
	let best = 0;
	for ( let i = 1; i < queue.length; i++ ) {
		const a = queue[ i ];
		const b = queue[ best ];
		if ( a.priority < b.priority || ( a.priority === b.priority && a.seq < b.seq ) ) {
			best = i;
		}
	}
	return queue.splice( best, 1 )[ 0 ];
}

function settleBatchItem( job: Job, item: BatchItemResult | undefined ) {
	if ( ! item ) {
		settle( job, 'reject', { code: 'batch_item_missing', status: 500 } );
		return;
	}
	if ( item.status >= 200 && item.status < 300 ) {
		settle( job, 'resolve', item.status === 204 ? null : item.body );
		return;
	}
	// The shape `normalizeErrorResponse()` gives a single request's failure.
	const { body } = item;
	settle(
		job,
		'reject',
		typeof body === 'object' && body !== null && ! Array.isArray( body ) && ! ( 'status' in body )
			? { ...body, status: item.status }
			: body
	);
}

function fetchOne( job: Job ): Promise< void > {
	return fetchPreservingStatus( { path: job.path, method: 'GET', signal: job.signal } ).then(
		value => settle( job, 'resolve', value ),
		error => settle( job, 'reject', error )
	);
}

async function dispatch( jobs: Job[] ): Promise< void > {
	if ( jobs.length === 1 ) {
		return fetchOne( jobs[ 0 ] );
	}

	// The shared request is abandoned only once every read it carries has been.
	const controller = new AbortController();
	const abortIfAbandoned = () => {
		if ( jobs.every( job => job.settled ) ) {
			controller.abort();
		}
	};
	jobs.forEach( job => job.signal?.addEventListener( 'abort', abortIfAbandoned, { once: true } ) );

	try {
		const results = await fetchPreservingStatus< BatchItemResult[] >( {
			path: `${ statsProxyPath }/batch`,
			method: 'POST',
			data: { requests: jobs.map( job => job.path.slice( statsProxyPath.length ) ) },
			signal: controller.signal,
		} );
		jobs.forEach( ( job, index ) => settleBatchItem( job, results?.[ index ] ) );
	} catch ( error ) {
		// A site whose server code predates the route: stop batching and send these reads one by one.
		if ( getApiErrorCode( error ) === 'rest_no_route' ) {
			batchRouteMissing = true;
			await Promise.all( jobs.filter( job => ! job.settled ).map( fetchOne ) );
			return;
		}
		jobs.forEach( job => settle( job, 'reject', error ) );
	} finally {
		jobs.forEach( job => job.signal?.removeEventListener( 'abort', abortIfAbandoned ) );
	}
}

function pump() {
	while ( inFlight < MAX_IN_FLIGHT && queue.length ) {
		const jobs: Job[] = [];
		while ( jobs.length < BATCH_SIZE && queue.length ) {
			jobs.push( takeNext() );
		}
		inFlight++;
		dispatch( jobs ).finally( () => {
			inFlight--;
			pump();
		} );
	}
}

/**
 * Queue a local proxy GET to go out in a batch with the reads around it, primary periods first.
 *
 * @param path     - The full apiFetch path, query string included.
 * @param priority - Which period the read serves; comparison reads leave after primary ones.
 * @param signal   - Cancels the read: dropped from the queue, or detached from its batch.
 * @return The parsed response body.
 */
export function scheduleProxyGet< T >(
	path: string,
	priority: ProxyPriority | undefined,
	signal?: AbortSignal
): Promise< T > {
	return new Promise< T >( ( resolve, reject ) => {
		if ( signal?.aborted ) {
			reject( abortReason( signal ) );
			return;
		}

		const job: Job = {
			path,
			priority: priority === 'comparison' ? 1 : 0,
			seq: seq++,
			signal,
			settled: false,
			resolve: resolve as ( value: unknown ) => void,
			reject,
		};
		if ( signal ) {
			job.onAbort = () => {
				const index = queue.indexOf( job );
				if ( index !== -1 ) {
					queue.splice( index, 1 );
				}
				settle( job, 'reject', abortReason( signal ) );
			};
			signal.addEventListener( 'abort', job.onAbort, { once: true } );
		}
		queue.push( job );

		if ( ! flushTimer ) {
			flushTimer = setTimeout( () => {
				flushTimer = null;
				pump();
			}, BATCH_WINDOW_MS );
		}
	} );
}
