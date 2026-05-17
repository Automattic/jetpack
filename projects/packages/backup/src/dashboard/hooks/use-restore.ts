import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchRestoreStatus, initiateRestore } from '../data/api/restore';
import { keys } from '../data/query-client';
import type { RestoreItems, RestoreState } from '../types/restore';

type Result = {
	state: RestoreState;
	submit: ( items: RestoreItems ) => void;
	reset: () => void;
};

const POLL_INTERVAL_MS = 1500;

/**
 * Real `useRestore` driving the modernized Restore screen via the
 * `/jetpack/v4/rewind/to/$rewindId` bridge.
 *
 * Submit kicks off the WPCOM rewind initiate and stores the restore id;
 * a polled status query then advances the state machine
 * idle → submitting → progress → success | error.
 *
 * @param rewindId - The backup's rewind id.
 * @return state + submit + reset.
 */
export function useRestore( rewindId: string ): Result {
	const [ restoreId, setRestoreId ] = useState< number | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	// Destructure to keep stable references for useCallback deps —
	// passing the whole `mutation` object trips
	// @tanstack/query/no-unstable-deps.
	const {
		mutate: kickOff,
		reset: resetMutation,
		isPending,
	} = useMutation( {
		mutationFn: ( items: RestoreItems ) => initiateRestore( rewindId, items ),
		onSuccess: result => {
			setRestoreId( result.id );
			setErrorMessage( null );
		},
		onError: ( err: Error ) => {
			setErrorMessage( err.message );
		},
	} );

	// Always-defined query key so @tanstack/query/exhaustive-deps stays
	// happy; the `enabled` flag keeps the placeholder query from firing.
	const effectiveRestoreId = restoreId ?? -1;
	const statusQuery = useQuery( {
		queryKey: keys.restoreStatus( effectiveRestoreId ),
		queryFn: () => fetchRestoreStatus( effectiveRestoreId ),
		enabled: restoreId !== null,
		refetchInterval: query =>
			query.state.data?.status === 'in-progress' || query.state.data?.status === 'queued'
				? POLL_INTERVAL_MS
				: false,
	} );

	const submit = useCallback( ( items: RestoreItems ) => kickOff( items ), [ kickOff ] );
	const reset = useCallback( () => {
		setRestoreId( null );
		setErrorMessage( null );
		resetMutation();
	}, [ resetMutation ] );

	let state: RestoreState = { phase: 'idle' };
	if ( errorMessage ) {
		state = { phase: 'error', message: errorMessage };
	} else if ( isPending ) {
		state = { phase: 'submitting' };
	} else if ( statusQuery.data?.status === 'finished' ) {
		state = { phase: 'success' };
	} else if ( statusQuery.data?.status === 'failed' ) {
		// `error_code` is a machine identifier (e.g. `"checksum_mismatch"`)
		// — never surface it to users; fall straight through to the
		// translated generic message when `message` is empty.
		state = {
			phase: 'error',
			message: statusQuery.data.message || __( 'Restore failed.', 'jetpack-backup-pkg' ),
		};
	} else if ( restoreId !== null && statusQuery.error ) {
		// Network/HTTP failure mid-poll: surface so the UI doesn't sit
		// in `progress` at the last known percent with no way out.
		state = {
			phase: 'error',
			message:
				statusQuery.error.message || __( 'Lost connection while restoring.', 'jetpack-backup-pkg' ),
		};
	} else if ( restoreId !== null && statusQuery.data ) {
		state = {
			phase: 'progress',
			percent: Math.round( statusQuery.data.progress ?? 0 ),
		};
	} else if ( restoreId !== null ) {
		state = { phase: 'progress', percent: 0 };
	}

	return { state, submit, reset };
}
