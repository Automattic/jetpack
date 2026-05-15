import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchDownloadStatus, initiateDownload } from '../data/api/download';
import { keys } from '../data/query-client';

type DownloadState =
	| { phase: 'idle' }
	| { phase: 'submitting' }
	| { phase: 'progress'; percent: number }
	| { phase: 'success'; downloadUrl: string }
	| { phase: 'error'; message: string };

type Result = {
	state: DownloadState;
	submit: () => void;
	reset: () => void;
};

const POLL_INTERVAL_MS = 1500;

/**
 * Real `useDownload` driving the modernized Download screen via the
 * `/jetpack/v4/backups/download/$rewindId` bridge.
 *
 * Submit kicks off the WPCOM `prepare-download` and stores the download
 * id; a polled status query then advances the state machine
 * idle → submitting → progress → success | error.
 *
 * @param rewindId - The backup's rewind id.
 * @return state + submit + reset.
 */
export function useDownload( rewindId: string ): Result {
	const [ downloadId, setDownloadId ] = useState< number | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	const {
		mutate: mutateInitiate,
		reset: resetMutation,
		isPending: isInitiating,
	} = useMutation( {
		mutationFn: () => initiateDownload( rewindId ),
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
		enabled: downloadId !== null,
		refetchInterval: query =>
			query.state.data?.status === 'in-progress' ? POLL_INTERVAL_MS : false,
	} );

	const submit = useCallback( () => mutateInitiate(), [ mutateInitiate ] );
	const reset = useCallback( () => {
		setDownloadId( null );
		setErrorMessage( null );
		resetMutation();
	}, [ resetMutation ] );

	let state: DownloadState = { phase: 'idle' };
	if ( errorMessage ) {
		state = { phase: 'error', message: errorMessage };
	} else if ( isInitiating ) {
		state = { phase: 'submitting' };
	} else if ( statusQuery.data?.status === 'completed' && statusQuery.data.url ) {
		state = { phase: 'success', downloadUrl: statusQuery.data.url };
	} else if ( statusQuery.data?.status === 'failed' ) {
		state = { phase: 'error', message: __( 'Download failed.', 'jetpack-backup-pkg' ) };
	} else if ( downloadId !== null && statusQuery.data ) {
		state = {
			phase: 'progress',
			percent: Math.round( ( statusQuery.data.progress ?? 0 ) * 100 ),
		};
	} else if ( downloadId !== null ) {
		state = { phase: 'progress', percent: 0 };
	}

	return { state, submit, reset };
}
