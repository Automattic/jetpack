/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getApiErrorCode, getApiErrorStatus } from '../utils/api-error';
import { statsProxyPath } from './constants';
import { fetchPreservingStatus } from './stats-proxy-fetch';

/** Batches in flight at once; on HTTP/1.1 this leaves two of six connections for assets and other requests. */
const MAX_IN_FLIGHT = 4;

/** How long the first queued read waits for others to join it; widgets mount over several renders. */
const BATCH_WINDOW_MS = 50;

type Job = {
	path: string;
	group?: string;
	signal?: AbortSignal;
	settled: boolean;
	resolve: ( value: unknown ) => void;
	reject: ( reason: unknown ) => void;
	onAbort?: () => void;
};

type BatchItemResult = { status: number; body: unknown };

const queue: Job[] = [];
let inFlight = 0;
let flushTimer: ReturnType< typeof setTimeout > | null = null;
let batchingOff = false;

/** Reads per batch, from the server: 0 where it cannot fetch a batch in parallel, or a host turned batching off. */
function batchSize(): number {
	return getScriptData()?.premium_analytics?.proxy_batch_size ?? 0;
}

/**
 * Whether to batch local proxy reads. Batching runs on every protocol, though HTTP/1.1, with its
 * six connections per host, gains most.
 *
 * @return Whether local proxy reads should be batched.
 */
export function shouldBatchProxyReads(): boolean {
	return ! batchingOff && batchSize() > 1;
}

/**
 * Whether the batch request itself failed, so its reads may still succeed one by one: a missing
 * route, a server error, an unreadable reply, or none at all. Refusals such as 403 are left alone.
 *
 * @param error - What the batch request threw.
 * @return Whether to fall back to single reads.
 */
function isBatchFailure( error: unknown ): boolean {
	const code = getApiErrorCode( error );
	const status = getApiErrorStatus( error );
	return (
		code === 'rest_no_route' ||
		code === 'fetch_error' ||
		code === 'invalid_json' ||
		( status !== null && status >= 500 )
	);
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

/**
 * Take the next reads off the queue, oldest first, keeping each read's group mates with it.
 *
 * @param size - How many reads to take; a group may run past it.
 * @return The batch's reads.
 */
function takeBatch( size: number ): Job[] {
	const jobs: Job[] = [];
	while ( jobs.length < size && queue.length ) {
		const job = queue.shift() as Job;
		jobs.push( job );
		// A widget's two periods land together, so its chart is drawn once rather than twice.
		if ( size > 1 && job.group ) {
			for ( let i = 0; i < queue.length; ) {
				if ( queue[ i ].group === job.group ) {
					jobs.push( ...queue.splice( i, 1 ) );
				} else {
					i++;
				}
			}
		}
	}
	return jobs;
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
		// Send these reads one by one, and the page's later ones too, rather than retry a failing batch.
		if ( isBatchFailure( error ) ) {
			batchingOff = true;
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
		const jobs = takeBatch( batchingOff ? 1 : batchSize() );
		inFlight++;
		dispatch( jobs ).finally( () => {
			inFlight--;
			pump();
		} );
	}
}

/**
 * Queue a local proxy GET to go out in a batch with the reads around it.
 *
 * @param path   - The full apiFetch path, query string included.
 * @param group  - Reads sharing a group go out in one batch, such as a widget's two periods.
 * @param signal - Cancels the read: dropped from the queue, or detached from its batch.
 * @return The parsed response body.
 */
export function scheduleProxyGet< T >(
	path: string,
	group: string | undefined,
	signal?: AbortSignal
): Promise< T > {
	return new Promise< T >( ( resolve, reject ) => {
		if ( signal?.aborted ) {
			reject( abortReason( signal ) );
			return;
		}

		const job: Job = {
			path,
			group,
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
