import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ApiError, errorCode } from '../data/api/_helpers';
import {
	fetchDownloadStatus,
	fetchDownloads,
	initiateDownload,
	initiateFileDownload,
	pickResumableDownload,
} from '../data/api/download';
import { keys } from '../data/query-client';
import { RECONNECT_AFTER_FAILURES, usePollFailures } from './use-poll-failures';
import type { FailureReference, ReferenceId } from '../types/failure-reference';
import type { RestoreItems } from '../types/restore';

type DownloadState =
	| { phase: 'idle' }
	| { phase: 'checking' }
	| { phase: 'submitting' }
	| { phase: 'progress'; percent: number; reconnecting?: boolean }
	| { phase: 'success'; downloadUrl: string; validUntil: string }
	| { phase: 'error'; message: string; reference: FailureReference };

// A download is scoped by categories *or* by named files, never both:
// upstream models `paths` as one of the six categories.
type DownloadRequest = { items: RestoreItems } | { files: string };

type Result = {
	state: DownloadState;
	submit: ( items: RestoreItems ) => void;
	submitFiles: ( files: string ) => void;
	reset: () => void;
};

export const POLL_INTERVAL_MS = 1500;
const POLL_MAX_INTERVAL_MS = 15_000;
// Slower interval once this many polls have run: ~1 minute at the base, ~5 minutes in all.
const POLL_BACKOFF_STEPS = [
	{ afterPolls: 40, intervalMs: 5000 },
	{ afterPolls: 88, intervalMs: POLL_MAX_INTERVAL_MS },
];

/**
 * The poll interval after `polls` status requests, whatever their outcome.
 *
 * @param polls - Polls so far, failed ones included.
 * @return Milliseconds until the next poll.
 */
function pollInterval( polls: number ): number {
	let interval = POLL_INTERVAL_MS;
	for ( const step of POLL_BACKOFF_STEPS ) {
		if ( polls >= step.afterPolls ) {
			interval = step.intervalMs;
		}
	}
	return interval;
}

/**
 * Whether a failed poll is a refusal that retrying cannot fix.
 *
 * The bridge forwards an upstream 4xx as-is in `data.status`. Network
 * errors and 5xx stay temporary, as do 408 and 429.
 *
 * @param error - The rejection from the status poll.
 * @return True for a 4xx other than 408 and 429.
 */
function isPermanentPollError( error: unknown ): boolean {
	const status = error instanceof ApiError ? ( error.data as { status?: unknown } )?.status : null;
	return (
		typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429
	);
}

type PollState = { data?: { status?: string }; error: unknown };

/**
 * Whether the download still needs status reads: no permanent error, and not yet finished.
 *
 * @param state - The status query state.
 * @return True while polling should go on.
 */
function isWaiting( state: PollState ): boolean {
	const status = state.data?.status;
	return ! isPermanentPollError( state.error ) && ( status === undefined || status === 'running' );
}

/**
 * Real `useDownload` driving the modernized Download screen via the
 * `/jetpack/v4/backups/download/$rewindId` bridge.
 *
 * Submit asks WPCOM to build the archive and stores the download id; a
 * polled status query then advances the state machine
 * idle → submitting → progress → success | error.
 *
 * The bridge derives `status` for us, because WPCOM's own payload has no
 * status field — it signals lifecycle by which keys are present.
 *
 * Every read is gated on `enabled`, which the screen supplies from the gate
 * verdict — see `useRestore` for why the gating lives here rather than below
 * `<Gates>`.
 *
 * With `resume`, it first looks for a download of this backup already under
 * way, so a reload finds it again. Until that answers, the state is `checking`.
 *
 * @param rewindId - The backup's rewind id.
 * @param enabled  - Whether this site may query WordPress.com at all.
 * @param resume   - Whether to look for a download already under way.
 * @return state + submit + submitFiles + reset.
 */
export function useDownload( rewindId: string, enabled = true, resume = false ): Result {
	const [ downloadId, setDownloadId ] = useState< number | null >( null );
	const [ submitError, setSubmitError ] = useState< Error | null >( null );
	// Set once the reader submits or resets, so a found download never returns over their choice.
	const [ hasActed, setHasActed ] = useState( false );
	const canResume = resume && ! hasActed;

	const lookup = useQuery( {
		queryKey: keys.downloads(),
		queryFn: fetchDownloads,
		enabled: enabled && canResume,
		// Every visit asks again: a cached empty list would hide a download started since.
		gcTime: 0,
		// The form is the fallback, and a new request is handed any download still building.
		retry: false,
	} );
	const found = canResume ? pickResumableDownload( lookup.data, rewindId ) : null;
	const isChecking = enabled && canResume && lookup.isPending;
	const activeId = downloadId ?? found?.id ?? null;

	const {
		mutate: mutateInitiate,
		reset: resetMutation,
		isPending: isInitiating,
	} = useMutation( {
		mutationFn: ( request: DownloadRequest ) =>
			'files' in request
				? initiateFileDownload( rewindId, request.files )
				: initiateDownload( rewindId, request.items ),
		onSuccess: result => {
			setDownloadId( result.id );
			setSubmitError( null );
		},
		onError: ( err: Error ) => {
			setSubmitError( err );
		},
	} );

	const effectiveDownloadId = activeId ?? -1;
	const statusQuery = useQuery( {
		queryKey: keys.downloadStatus( rewindId, effectiveDownloadId ),
		queryFn: () => fetchDownloadStatus( rewindId, effectiveDownloadId ),
		enabled: activeId !== null && enabled,
		// Backed-off polls skip hidden tabs, so refetch on refocus instead of waiting up to 15s.
		refetchOnWindowFocus: query => ( isWaiting( query.state ) ? 'always' : false ),
		// No reading yet is not a reason to stop: the first poll may simply have failed.
		refetchInterval: query =>
			isWaiting( query.state )
				? pollInterval( query.state.dataUpdateCount + query.state.errorUpdateCount )
				: false,
	} );
	const failedPolls = usePollFailures( statusQuery.errorUpdatedAt, statusQuery.dataUpdatedAt );
	// A found download stands in for its status until the first read answers.
	const download = statusQuery.data ?? ( found?.id === activeId ? found : undefined );

	// Drops the download on screen first, so a ready one cannot outlast the new request.
	const start = useCallback(
		( request: DownloadRequest ) => {
			setHasActed( true );
			setDownloadId( null );
			mutateInitiate( request );
		},
		[ mutateInitiate ]
	);
	const submit = useCallback( ( items: RestoreItems ) => start( { items } ), [ start ] );
	const submitFiles = useCallback( ( files: string ) => start( { files } ), [ start ] );
	const reset = useCallback( () => {
		setHasActed( true );
		setDownloadId( null );
		setSubmitError( null );
		resetMutation();
	}, [ resetMutation ] );

	// The download once it exists; before that, the backup it was asked of.
	const referenceId: ReferenceId =
		activeId !== null ? { kind: 'download', value: activeId } : { kind: 'backup', value: rewindId };

	// `activeId` is read before `isInitiating`: StrictMode's remount detaches
	// the observer from the in-flight mutation and never reattaches it, so
	// `isPending` latches true while `onSuccess` still lands the id.
	let state: DownloadState = { phase: 'idle' };
	if ( submitError?.message ) {
		state = {
			phase: 'error',
			message: submitError.message,
			reference: { code: errorCode( submitError ), id: referenceId },
		};
	} else if ( download?.status === 'finished' && download.url ) {
		state = {
			phase: 'success',
			downloadUrl: download.url,
			validUntil: download.valid_until,
		};
	} else if ( download?.status === 'expired' ) {
		state = {
			phase: 'error',
			message: __( 'This download has expired.', 'jetpack-backup-pkg' ),
			reference: { code: null, id: referenceId },
		};
	} else if ( download?.status === 'failed' ) {
		state = {
			phase: 'error',
			// WPCOM's reason when it gave one, since "Download failed."
			// tells nobody anything — but carried inside a translated frame
			// rather than shown as the whole message, so an upstream string
			// in one language can't be the only text on an otherwise
			// translated screen.
			message: download.error
				? sprintf(
						/* translators: %s: the reason WordPress.com gave for the failure. */
						__( 'Download failed: %s', 'jetpack-backup-pkg' ),
						download.error
					)
				: __( 'Download failed.', 'jetpack-backup-pkg' ),
			// Upstream reports this one in prose only, so there is no code to quote.
			reference: { code: null, id: referenceId },
		};
	} else if ( activeId !== null && isPermanentPollError( statusQuery.error ) ) {
		state = {
			phase: 'error',
			message:
				statusQuery.error?.message ||
				__( 'Lost connection while preparing download.', 'jetpack-backup-pkg' ),
			reference: { code: errorCode( statusQuery.error ), id: referenceId },
		};
	} else if ( activeId !== null ) {
		state = {
			// `progress` is already 0–100 — WPCOM coerces it to an
			// integer, which a 0–1 float could not survive. Multiplying by
			// 100 fed the ProgressBar values up to 10000. Absent until the
			// first poll answers, which is the bar's 0% opening frame.
			phase: 'progress',
			percent: download?.progress ?? 0,
			// A failed poll mid-download is temporary; say so only once it keeps failing.
			...( failedPolls >= RECONNECT_AFTER_FAILURES && { reconnecting: true } ),
		};
	} else if ( isInitiating ) {
		state = { phase: 'submitting' };
	} else if ( isChecking ) {
		state = { phase: 'checking' };
	}

	return { state, submit, submitFiles, reset };
}
