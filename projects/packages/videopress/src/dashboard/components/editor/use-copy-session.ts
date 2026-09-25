import { useEffect, useRef, useState } from 'react';
import {
	useSaveVideoCopy,
	useVideoCopyStatus,
	VideoCopyRejectedError,
} from '../../hooks/use-save-video-copy';
import { EditsConflictError } from '../../hooks/use-save-video-edits';
import type { SaveVideoCopyVars } from '../../hooks/use-save-video-copy';

type StoredCopy = { request: SaveVideoCopyVars; accepted: boolean };

/**
 * Read a pending copy from this browser tab; storage may be unavailable.
 * @param guid - Source video GUID.
 * @return The saved request, if it belongs to this source.
 */
function readPendingCopy( guid: string ): StoredCopy | null {
	try {
		const stored = JSON.parse( sessionStorage.getItem( `videopress-copy:${ guid }` ) || 'null' );
		return stored?.request?.guid === guid &&
			typeof stored.request.requestId === 'string' &&
			Array.isArray( stored.request.operations )
			? stored
			: null;
	} catch {
		return null;
	}
}

/**
 * Preserve the idempotency key before sending a request that could outlive this page.
 * @param guid  - Source video GUID.
 * @param value - Pending request, or null to forget a terminal result.
 */
function storePendingCopy( guid: string, value: StoredCopy | null ) {
	try {
		if ( value ) {
			sessionStorage.setItem( `videopress-copy:${ guid }`, JSON.stringify( value ) );
		} else {
			sessionStorage.removeItem( `videopress-copy:${ guid }` );
		}
	} catch {
		// Storage restrictions must not prevent saving or following the current request.
	}
}

/**
 * Retain a copy request across uncertain responses so retrying cannot create duplicates.
 *
 * @param guid - Source video GUID.
 * @return The copy lifecycle and actions.
 */
export function useCopySession( guid: string ) {
	const mutation = useSaveVideoCopy();
	const [ stored ] = useState( () => readPendingCopy( guid ) );
	const [ request, setRequest ] = useState< SaveVideoCopyVars | null >( stored?.request ?? null );
	const [ accepted, setAccepted ] = useState( Boolean( stored?.accepted ) );
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState< Error | null >(
		stored && ! stored.accepted ? new Error( 'Copy acceptance unconfirmed' ) : null
	);
	const submittingRef = useRef( false );
	const requestRef = useRef< SaveVideoCopyVars | null >( request );
	const acceptanceUncertainRef = useRef( Boolean( stored ) );
	const rejected = error instanceof VideoCopyRejectedError && ! acceptanceUncertainRef.current;
	const conflict = error instanceof EditsConflictError && ! acceptanceUncertainRef.current;
	const status = useVideoCopyStatus(
		guid,
		submitting || rejected || conflict ? null : ( request?.requestId ?? null )
	);
	const recoverable =
		status.data?.job?.status === 'failed' &&
		status.data.job.error?.code === 'copy_attachment_unconfirmed';
	const needsAssistance =
		status.data?.job?.status === 'failed' &&
		status.data.job.error?.code === 'copy_attachment_pending';
	const failed = status.data?.job?.status === 'failed' && ! recoverable && ! needsAssistance;

	const confirmed = accepted || Boolean( status.data );
	const saved = Boolean( request ) && confirmed && ! failed && ! rejected && ! conflict;
	useEffect( () => {
		if ( ! request ) {
			return;
		}
		if ( failed || rejected || conflict || status.data?.job?.status === 'complete' ) {
			storePendingCopy( guid, null );
		} else {
			storePendingCopy( guid, { request, accepted: confirmed } );
		}
	}, [ guid, request, confirmed, failed, rejected, conflict, status.data?.job?.status ] );

	const submit = async ( nextRequest: SaveVideoCopyVars ) => {
		if (
			needsAssistance ||
			submittingRef.current ||
			( requestRef.current && nextRequest !== requestRef.current )
		) {
			return;
		}
		submittingRef.current = true;
		setSubmitting( true );
		setError( null );
		setRequest( nextRequest );
		requestRef.current = nextRequest;
		storePendingCopy( guid, { request: nextRequest, accepted } );
		try {
			await mutation.mutateAsync( nextRequest );
			setAccepted( true );
			acceptanceUncertainRef.current = true;
		} catch ( caught ) {
			// A later rejection cannot disprove acceptance of an earlier interrupted request.
			if ( ! (
				caught instanceof VideoCopyRejectedError || caught instanceof EditsConflictError
			) ) {
				acceptanceUncertainRef.current = true;
			} else if ( ! acceptanceUncertainRef.current ) {
				storePendingCopy( guid, null );
			}
			setError( caught as Error );
		} finally {
			submittingRef.current = false;
			setSubmitting( false );
		}
	};

	return {
		request,
		saved,
		submitting,
		error,
		recoverable,
		needsAssistance,
		conflict,
		rejected,
		failed,
		locked: Boolean( request ) && ! failed && ! conflict && ! rejected,
		status,
		submit,
		retry: () => request && submit( request ),
		clear: () => {
			if (
				submittingRef.current ||
				( requestRef.current && ! failed && ! conflict && ! rejected )
			) {
				return;
			}
			requestRef.current = null;
			acceptanceUncertainRef.current = false;
			storePendingCopy( guid, null );
			setAccepted( false );
			setRequest( null );
			setError( null );
		},
	};
}
