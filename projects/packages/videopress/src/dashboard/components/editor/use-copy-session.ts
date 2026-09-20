import { useRef, useState } from 'react';
import {
	useSaveVideoCopy,
	useVideoCopyStatus,
	VideoCopyRejectedError,
} from '../../hooks/use-save-video-copy';
import { EditsConflictError } from '../../hooks/use-save-video-edits';
import type { SaveVideoCopyVars } from '../../hooks/use-save-video-copy';

/**
 * Retain a copy request across uncertain responses so retrying cannot create duplicates.
 *
 * @param guid - Source video GUID.
 * @return The copy lifecycle and actions.
 */
export function useCopySession( guid: string ) {
	const mutation = useSaveVideoCopy();
	const [ request, setRequest ] = useState< SaveVideoCopyVars | null >( null );
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState< Error | null >( null );
	const submittingRef = useRef( false );
	const requestRef = useRef< SaveVideoCopyVars | null >( null );
	const acceptanceUncertainRef = useRef( false );
	const rejected = error instanceof VideoCopyRejectedError && ! acceptanceUncertainRef.current;
	const conflict = error instanceof EditsConflictError && ! acceptanceUncertainRef.current;
	const status = useVideoCopyStatus(
		guid,
		submitting || rejected || conflict ? null : ( request?.requestId ?? null )
	);
	const recoverable =
		status.data?.job.status === 'failed' &&
		status.data.job.error?.code === 'copy_attachment_unconfirmed';
	const needsAssistance =
		status.data?.job.status === 'failed' &&
		status.data.job.error?.code === 'copy_attachment_pending';
	const failed = status.data?.job.status === 'failed' && ! recoverable && ! needsAssistance;

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
		try {
			await mutation.mutateAsync( nextRequest );
			acceptanceUncertainRef.current = true;
		} catch ( caught ) {
			// A later rejection cannot disprove acceptance of an earlier interrupted request.
			if ( ! (
				caught instanceof VideoCopyRejectedError || caught instanceof EditsConflictError
			) ) {
				acceptanceUncertainRef.current = true;
			}
			setError( caught as Error );
		} finally {
			submittingRef.current = false;
			setSubmitting( false );
		}
	};

	return {
		request,
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
			setRequest( null );
			setError( null );
		},
	};
}
