import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
	createHistory,
	withHistory,
} from '../../../client/components/chapters-editor/state/history';
import { useRestoreOriginal } from '../../hooks/use-restore-original';
import { useRetryVideoProcessing } from '../../hooks/use-retry-video-processing';
import { EditsConflictError, useSaveVideoEdits } from '../../hooks/use-save-video-edits';
import { useVideoEdits } from '../../hooks/use-video-edits';
import { createEditSession, editSessionReducer, sessionEditsEqual } from './state/edit-session';
import { isDirty, sessionToOperations } from './state/serialize';
import type { EditSession, EditSessionAction } from './state/edit-session';
import type { HistoryAction } from '../../../client/components/chapters-editor/state/history';
import type { SaveVideoCopyVars } from '../../hooks/use-save-video-copy';
import type { SaveEditsResponse, VideoEdits } from '../../types/edits';
import type { LibraryItem } from '../../types/library';

const reducer = withHistory< EditSession, EditSessionAction >( editSessionReducer, {
	clearOn: action => action.type === 'LOAD' || action.type === 'RESET',
	equals: sessionEditsEqual,
} );

/**
 * Keep local edits against the revision they were made on until a processing job commits.
 *
 * @param video       - The attachment being edited.
 * @param copyRequest - Recover the draft and its revision from a pending copy after navigation.
 * @return The edit session, processing state, and save/restore actions.
 */
export function useEditSession( video: LibraryItem, copyRequest?: SaveVideoCopyVars | null ) {
	const query = useVideoEdits( video.guid );
	const saveMutation = useSaveVideoEdits();
	const restoreMutation = useRestoreOriginal();
	const retryMutation = useRetryVideoProcessing();
	const notices = useGlobalNotices();
	const noticesRef = useRef( notices );
	noticesRef.current = notices;
	const [ history, dispatch ] = useReducer( reducer, video.durationSeconds, duration =>
		createHistory( createEditSession( duration * 1000 ) )
	);
	const [ baseline, setBaseline ] = useState< VideoEdits | null >( null );
	const [ pending, setPending ] = useState< SaveEditsResponse | null >( null );
	const [ submittedDraft, setSubmittedDraft ] = useState< {
		jobId: string | null;
		session: EditSession;
	} | null >( null );
	const baselineRef = useRef< VideoEdits | null >( null );
	const pendingRef = useRef< SaveEditsResponse | null >( null );
	const handledJobRef = useRef< string | null >( null );
	const [ conflict, setConflict ] = useState( false );
	const [ lastAction, setLastAction ] = useState< 'save' | 'restore' >( 'save' );
	const [ requestPending, setRequestPending ] = useState( false );
	const requestRef = useRef( false );
	const session = history.present;
	const dirty = baseline !== null && isDirty( session, baseline.operations );
	const locked =
		! baseline || requestPending || Boolean( pending ) || query.edits?.job?.status === 'processing';
	const canRetry = Boolean(
		query.edits?.can_retry &&
		query.edits.job?.status === 'failed' &&
		! locked &&
		! conflict &&
		( ! dirty ||
			( submittedDraft?.jobId === query.edits.job.id &&
				sessionEditsEqual( session, submittedDraft.session ) ) )
	);
	const stateRef = useRef( { session, baseline, locked, dirty, conflict, canRetry } );
	stateRef.current = { session, baseline, locked, dirty, conflict, canRetry };

	const adopt = useCallback( ( edits: VideoEdits ) => {
		baselineRef.current = edits;
		dispatch( {
			type: 'LOAD',
			operations: edits.operations,
			durationMs: edits.original_duration_ms,
		} );
		setBaseline( edits );
		setSubmittedDraft( null );
		setConflict( false );
	}, [] );

	useEffect( () => {
		const edits = query.edits;
		if ( ! edits ) {
			return;
		}
		const current = stateRef.current;
		const currentBaseline = baselineRef.current;
		const pendingJob = pendingRef.current;
		const ownJob = pendingJob && edits.job.id === pendingJob.job.id;
		if ( ownJob && ( edits.job.status === 'complete' || edits.job.status === 'failed' ) ) {
			const jobKey = `${ edits.guid }:${ edits.job.id }:${ edits.job.status }`;
			if ( handledJobRef.current === jobKey ) {
				return;
			}
			// External stores can render synchronously before the queued React state updates commit.
			handledJobRef.current = jobKey;
			pendingRef.current = null;
			setPending( null );
			if ( edits.job.status === 'complete' ) {
				adopt( edits );
				noticesRef.current.createSuccessNotice(
					__( 'Video edits applied.', 'jetpack-videopress-pkg' )
				);
			}
		} else if ( ! currentBaseline ) {
			adopt( edits );
			if ( copyRequest ) {
				dispatch( {
					type: 'LOAD',
					operations: copyRequest.operations,
					durationMs: edits.original_duration_ms,
				} );
				setConflict( copyRequest.baseRevision !== edits.revision );
			}
		} else if ( edits.revision !== currentBaseline.revision ) {
			if ( pendingJob || current.dirty ) {
				pendingRef.current = null;
				setConflict( true );
				setPending( null );
			} else {
				adopt( edits );
			}
		}
	}, [ query.edits, pending, adopt, copyRequest ] );

	const guardedDispatch = useCallback( ( action: HistoryAction< EditSessionAction > ) => {
		if ( ! stateRef.current.locked && ! stateRef.current.conflict ) {
			dispatch( action );
		}
	}, [] );

	const discard = useCallback( () => {
		if ( stateRef.current.baseline ) {
			adopt( stateRef.current.baseline );
		}
	}, [ adopt ] );

	const submit = useCallback(
		async ( restore = false ) => {
			const current = stateRef.current;
			if ( requestRef.current || current.locked || current.conflict || ! current.baseline ) {
				return;
			}
			requestRef.current = true;
			setRequestPending( true );
			setLastAction( restore ? 'restore' : 'save' );
			try {
				const response = restore
					? await restoreMutation.mutateAsync( { guid: video.guid } )
					: await saveMutation.mutateAsync( {
							guid: video.guid,
							baseRevision: current.baseline.revision,
							operations: sessionToOperations(
								current.session,
								current.baseline.original_duration_ms
							),
						} );
				pendingRef.current = response;
				setSubmittedDraft( { jobId: response.job.id, session: current.session } );
				setPending( response );
			} catch ( error ) {
				if ( error instanceof EditsConflictError ) {
					setConflict( true );
				} else {
					noticesRef.current.createErrorNotice(
						__( 'Unable to apply video edits. Please try again.', 'jetpack-videopress-pkg' )
					);
				}
			} finally {
				requestRef.current = false;
				setRequestPending( false );
			}
		},
		[ video.guid, saveMutation, restoreMutation ]
	);

	const retryProcessing = async () => {
		const current = stateRef.current;
		const job = query.edits?.job;
		if ( requestRef.current || ! current.canRetry || job?.status !== 'failed' || ! job.id ) {
			return;
		}
		requestRef.current = true;
		setRequestPending( true );
		try {
			const response = await retryMutation.mutateAsync( { guid: video.guid, jobId: job.id } );
			pendingRef.current = response;
			setSubmittedDraft( { jobId: response.job.id, session: current.session } );
			setPending( response );
		} catch {
			noticesRef.current.createErrorNotice(
				__( 'Unable to retry processing. Please try again.', 'jetpack-videopress-pkg' )
			);
			void query.refetch();
		} finally {
			requestRef.current = false;
			setRequestPending( false );
		}
	};

	const reload = useCallback( async () => {
		const result = await query.refetch();
		if ( result.data ) {
			pendingRef.current = null;
			setPending( null );
			adopt( result.data );
		}
	}, [ query.refetch, adopt ] );

	return {
		baseline,
		history,
		session,
		dirty,
		hasUnsavedChanges: dirty && ! pending,
		locked,
		conflict,
		canRetry,
		lastAction,
		dispatch: guardedDispatch,
		discard,
		submit,
		retryProcessing,
		reload,
		...query,
	};
}
