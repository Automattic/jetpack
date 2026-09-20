import { useRef, useState } from 'react';
import { useSaveVideoCopy, useVideoCopyStatus } from '../../hooks/use-save-video-copy';
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
	const status = useVideoCopyStatus( guid, submitting ? null : ( request?.requestId ?? null ) );
	const conflict = error instanceof EditsConflictError;
	const recoverable =
		status.data?.job.status === 'failed' &&
		[ 'copy_attachment_unconfirmed', 'copy_attachment_pending' ].includes(
			status.data.job.error?.code ?? ''
		);
	const failed = status.data?.job.status === 'failed' && ! recoverable;

	const submit = async ( nextRequest: SaveVideoCopyVars ) => {
		if ( submittingRef.current || ( requestRef.current && nextRequest !== requestRef.current ) ) {
			return;
		}
		submittingRef.current = true;
		setSubmitting( true );
		setError( null );
		setRequest( nextRequest );
		requestRef.current = nextRequest;
		try {
			await mutation.mutateAsync( nextRequest );
		} catch ( caught ) {
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
		conflict,
		failed,
		locked: Boolean( request ) && ! failed && ! conflict,
		status,
		submit,
		retry: () => request && submit( request ),
		clear: () => {
			if ( submittingRef.current || ( requestRef.current && ! failed && ! conflict ) ) {
				return;
			}
			requestRef.current = null;
			setRequest( null );
			setError( null );
		},
	};
}
