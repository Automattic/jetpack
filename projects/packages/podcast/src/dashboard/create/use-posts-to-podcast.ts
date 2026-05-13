import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useReducer, useRef } from '@wordpress/element';

const POLL_FAST_MS = 3000;
const POLL_SLOW_MS = 10000;
const POLL_SWITCH_MS = 30000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface WindowParam {
	unit: 'days' | 'months';
	n: number;
}

export interface GenerateParams {
	window: WindowParam;
	length: string;
	voicePreset: string;
}

export interface JobResult {
	postId: number;
}

type JobStatus = 'idle' | 'polling' | 'succeeded' | 'failed';

interface State {
	status: JobStatus;
	jobId: number | null;
	startedAt: number | null;
	result: JobResult | null;
	error: string | null;
}

type Action =
	| { type: 'START_POLLING'; jobId: number; startedAt: number }
	| { type: 'SUCCEEDED'; result: JobResult }
	| { type: 'FAILED'; message?: string | null }
	| { type: 'RESET' };

interface JobRecord {
	status: 'pending' | 'complete' | 'failed' | 'unknown';
	postId?: number;
	message?: string;
	errorMessage?: string;
}

interface StoredJob {
	jobId: number;
	startedAt: number;
}

const storageKey = ( blogId: number ): string => `posts-to-podcast:active-job:${ blogId }`;

const readStored = ( blogId: number ): StoredJob | null => {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	try {
		const raw = window.localStorage.getItem( storageKey( blogId ) );
		if ( ! raw ) {
			return null;
		}
		const parsed = JSON.parse( raw ) as Partial< StoredJob >;
		if ( ! parsed || ! parsed.jobId || typeof parsed.startedAt !== 'number' ) {
			return null;
		}
		return { jobId: parsed.jobId, startedAt: parsed.startedAt };
	} catch {
		return null;
	}
};

const writeStored = ( blogId: number, value: StoredJob ): void => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	try {
		window.localStorage.setItem( storageKey( blogId ), JSON.stringify( value ) );
	} catch {
		// no-op
	}
};

const clearStored = ( blogId: number ): void => {
	if ( typeof window === 'undefined' ) {
		return;
	}
	try {
		window.localStorage.removeItem( storageKey( blogId ) );
	} catch {
		// no-op
	}
};

const initial: State = {
	status: 'idle',
	jobId: null,
	startedAt: null,
	result: null,
	error: null,
};

const reducer = ( state: State, action: Action ): State => {
	switch ( action.type ) {
		case 'START_POLLING':
			return {
				status: 'polling',
				jobId: action.jobId,
				startedAt: action.startedAt,
				result: null,
				error: null,
			};
		case 'SUCCEEDED':
			return { ...state, status: 'succeeded', result: action.result };
		case 'FAILED':
			return { ...state, status: 'failed', error: action.message ?? null };
		case 'RESET':
			return initial;
		default:
			return state;
	}
};

export interface UsePostsToPodcastJobReturn {
	status: JobStatus;
	result: JobResult | null;
	error: string | null;
	generate: ( params: GenerateParams ) => Promise< void >;
	reset: () => void;
}

export const usePostsToPodcastJob = (): UsePostsToPodcastJobReturn => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );

	const [ state, dispatch ] = useReducer( reducer, initial, ( init ): State => {
		if ( ! blogId ) {
			return init;
		}
		const stored = readStored( blogId );
		if ( stored && Date.now() - stored.startedAt < POLL_TIMEOUT_MS ) {
			return {
				...init,
				status: 'polling',
				jobId: stored.jobId,
				startedAt: stored.startedAt,
			};
		}
		if ( stored ) {
			clearStored( blogId );
		}
		return init;
	} );

	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	useEffect( () => {
		if ( state.status !== 'polling' || state.jobId === null || state.startedAt === null ) {
			return undefined;
		}

		let cancelled = false;

		const poll = async (): Promise< void > => {
			if ( cancelled ) {
				return;
			}
			const startedAt = state.startedAt as number;
			const elapsed = Date.now() - startedAt;
			if ( elapsed > POLL_TIMEOUT_MS ) {
				clearStored( blogId );
				dispatch( { type: 'FAILED' } );
				return;
			}
			try {
				const record = await apiFetch< JobRecord >( {
					path: `/wpcom/v2/posts-to-podcast/jobs/${ state.jobId }`,
				} );
				if ( cancelled ) {
					return;
				}
				if ( record.status === 'complete' && record.postId ) {
					clearStored( blogId );
					dispatch( { type: 'SUCCEEDED', result: { postId: record.postId } } );
					return;
				}
				if ( record.status === 'failed' ) {
					clearStored( blogId );
					dispatch( {
						type: 'FAILED',
						message: record.message || record.errorMessage || null,
					} );
					return;
				}
				// Ensure the scheduled poll lands before the switch point, not just that now is before it.
				const nextDelay =
					Date.now() - startedAt + POLL_FAST_MS < POLL_SWITCH_MS ? POLL_FAST_MS : POLL_SLOW_MS;
				timerRef.current = setTimeout( poll, nextDelay );
			} catch {
				if ( cancelled ) {
					return;
				}
				clearStored( blogId );
				dispatch( { type: 'FAILED' } );
			}
		};

		void poll();

		return () => {
			cancelled = true;
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
				timerRef.current = null;
			}
		};
	}, [ state.status, state.jobId, state.startedAt, blogId ] );

	const inflightRef = useRef( false );

	const generate = useCallback(
		async ( params: GenerateParams ): Promise< void > => {
			if ( inflightRef.current ) {
				return;
			}
			if ( ! blogId ) {
				dispatch( { type: 'FAILED' } );
				return;
			}
			inflightRef.current = true;
			try {
				const response = await apiFetch< { jobId?: number } >( {
					path: '/wpcom/v2/posts-to-podcast',
					method: 'POST',
					data: params,
				} );
				if ( ! response?.jobId ) {
					dispatch( { type: 'FAILED' } );
					return;
				}
				const startedAt = Date.now();
				writeStored( blogId, { jobId: response.jobId, startedAt } );
				dispatch( { type: 'START_POLLING', jobId: response.jobId, startedAt } );
			} catch {
				dispatch( { type: 'FAILED' } );
			} finally {
				inflightRef.current = false;
			}
		},
		[ blogId ]
	);

	const reset = useCallback( (): void => {
		if ( blogId ) {
			clearStored( blogId );
		}
		dispatch( { type: 'RESET' } );
	}, [ blogId ] );

	return {
		status: state.status,
		result: state.result,
		error: state.error,
		generate,
		reset,
	};
};
