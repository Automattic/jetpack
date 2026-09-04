import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { fetchDownloadStatus, initiateDownload, initiateFileDownload } from '../data/api/download';
import { keys } from '../data/query-client';
import type { RestoreItems } from '../types/restore';

type DownloadState =
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'progress'; percent: number }
	| { phase: 'success'; downloadUrl: string; validUntil: string }
	| { phase: 'error'; message: string };

// A download is scoped by categories *or* by named files, never both:
// upstream models `paths` as one of the six categories.
type DownloadRequest = { items: RestoreItems } | { files: string };

type Result = {
	state: DownloadState;
	submit: ( items: RestoreItems ) => void;
	submitFiles: ( files: string ) => void;
	reset: () => void;
};

const POLL_INTERVAL_MS = 1500;

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
 * @param rewindId - The backup's rewind id.
 * @param enabled  - Whether this site may query WordPress.com at all.
 * @return state + submit + submitFiles + reset.
 */
export function useDownload( rewindId: string, enabled = true ): Result {
	const [ downloadId, setDownloadId ] = useState< number | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

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
			setErrorMessage( null );
		},
		onError: ( err: Error ) => {
			setErrorMessage( err.message );
		},
	} );

	const effectiveDownloadId = downloadId ?? -1;
	const statusQuery = useQuery( {
		queryKey: keys.downloadStatus( rewindId, effectiveDownloadId ),
		queryFn: () => fetchDownloadStatus( rewindId, effectiveDownloadId ),
		enabled: downloadId !== null && enabled,
		refetchInterval: query => ( query.state.data?.status === 'running' ? POLL_INTERVAL_MS : false ),
	} );

	const submit = useCallback(
		( items: RestoreItems ) => mutateInitiate( { items } ),
		[ mutateInitiate ]
	);
	const submitFiles = useCallback(
		( files: string ) => mutateInitiate( { files } ),
		[ mutateInitiate ]
	);
	const reset = useCallback( () => {
		setDownloadId( null );
		setErrorMessage( null );
		resetMutation();
	}, [ resetMutation ] );

	// `downloadId` is read before `isInitiating`: StrictMode's remount detaches
	// the observer from the in-flight mutation and never reattaches it, so
	// `isPending` latches true while `onSuccess` still lands the id.
	let state: DownloadState = { phase: 'idle' };
	if ( errorMessage ) {
		state = { phase: 'error', message: errorMessage };
	} else if ( statusQuery.data?.status === 'finished' && statusQuery.data.url ) {
		state = {
			phase: 'success',
			downloadUrl: statusQuery.data.url,
			validUntil: statusQuery.data.valid_until,
		};
	} else if ( statusQuery.data?.status === 'failed' ) {
		state = {
			phase: 'error',
			// WPCOM's reason when it gave one, since "Download failed."
			// tells nobody anything — but carried inside a translated frame
			// rather than shown as the whole message, so an upstream string
			// in one language can't be the only text on an otherwise
			// translated screen.
			message: statusQuery.data.error
				? sprintf(
						/* translators: %s: the reason WordPress.com gave for the failure. */
						__( 'Download failed: %s', 'jetpack-backup-pkg' ),
						statusQuery.data.error
				  )
				: __( 'Download failed.', 'jetpack-backup-pkg' ),
		};
	} else if ( downloadId !== null && statusQuery.error ) {
		// Network/HTTP failure mid-poll: surface so the UI doesn't sit
		// in `progress` at the last known percent with no way out.
		state = {
			phase: 'error',
			message:
				statusQuery.error.message ||
				__( 'Lost connection while preparing download.', 'jetpack-backup-pkg' ),
		};
	} else if ( downloadId !== null ) {
		state = {
			// `progress` is already 0–100 — WPCOM coerces it to an
			// integer, which a 0–1 float could not survive. Multiplying by
			// 100 fed the ProgressBar values up to 10000. Absent until the
			// first poll answers, which is the bar's 0% opening frame.
			phase: 'progress',
			percent: statusQuery.data?.progress ?? 0,
		};
	} else if ( isInitiating ) {
		state = { phase: 'submitting' };
	}

	return { state, submit, submitFiles, reset };
}
