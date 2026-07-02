/**
 * The Studio editor screen: operations rail | preview player over timeline,
 * with Undo/Redo/Discard/Save header actions and the save/restore flows
 * against the /wpcom/v2/videopress/{guid}/edits contract.
 *
 * State model: one history-wrapped edit-session reducer is the single store.
 * The server baseline (GET …/edits) is LOADed into the session on first
 * fetch; afterwards a revision change re-baselines automatically when it is
 * expected (our own save/restore job completing) or when the session is
 * clean, and raises the conflict banner otherwise. `isDirty` against the
 * latest baseline drives Save/Discard enablement, the beforeunload guard,
 * and the in-app navigation guards (sub-nav, links, browser back/forward).
 *
 * Timestamps everywhere are integer milliseconds on the ORIGINAL master
 * timeline. The session's duration prefers the server's
 * `original_duration_ms` (the ops contract is validated against it); element
 * metadata only shrinks it (media physically shorter than the server
 * believes), never extends it past what the server would accept.
 */
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useFilmstrip } from '../../hooks/use-filmstrip';
import { LIBRARY_QUERY_KEY } from '../../hooks/use-library';
import { useRestoreOriginal } from '../../hooks/use-restore-original';
import { EditsConflictError, useSaveVideoEdits } from '../../hooks/use-save-video-edits';
import { useVideo } from '../../hooks/use-video';
import { EDITS_QUERY_KEY, useVideoEdits } from '../../hooks/use-video-edits';
import VideoLayout from '../video-layout';
import { videoTabPath } from '../video-nav';
import StudioEditorConfirmDialog from './confirm-dialog';
import StudioEditorHeaderActions from './header-actions';
import StudioEditorOperationsPanel from './operations-panel';
import StudioEditorPreviewPlayer from './preview/preview-player';
import { createEditSession, editSessionReducer, sessionEditsEqual } from './state/edit-session';
import { canRedo, canUndo, createHistory, withHistory } from './state/history';
import { isDirty as isSessionDirty, sessionToOperations } from './state/serialize';
import StudioEditorStatusBanner from './status-banner';
import StudioEditorTimeline from './timeline/timeline';
import './style.scss';
import type { StudioEditorPreviewPlayerHandle } from './preview/preview-player';
import type { EditOperation, EditSession, EditSessionAction } from './state/edit-session';
import type { HistoryAction } from './state/history';
import type { ApiEditOperation } from '../../types/edits';
import type { LibraryItem } from '../../types/library';
import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from 'react';

type ConfirmAction = 'save' | 'discard' | 'restore';

type PendingJob = {
	kind: 'save' | 'restore';
	targetRevision: number;
};

/**
 * Whether the editor can operate on this attachment: a VideoPress video with
 * a guid (the edits API is keyed by guid) whose upload didn't fail.
 *
 * @param video - The library item.
 * @return Whether the editor applies.
 */
function isEditableVideo( video: LibraryItem ): boolean {
	return video.type === 'videopress' && Boolean( video.guid ) && video.upload.status !== 'failed';
}

/**
 * Narrow transport operations to the state core's union type. The shapes are
 * structurally identical; only the discriminant needs re-narrowing.
 *
 * @param operations - Operations from the edits response.
 * @return The same operations as state-core EditOperations.
 */
function toEditOperations( operations: ApiEditOperation[] ): EditOperation[] {
	return operations.map( op =>
		op.type === 'trim'
			? { type: 'trim', start_ms: op.start_ms, end_ms: op.end_ms }
			: { type: 'cut', start_ms: op.start_ms, end_ms: op.end_ms }
	);
}

type ChromeProps = {
	videoId: string;
	confirmNavigation?: () => boolean;
	actions?: ReactNode;
	children: ReactNode;
};

/**
 * The editor's page chrome: VideoLayout pinned to the Editor tab.
 *
 * @param props                   - Component props.
 * @param props.videoId           - The video's attachment id.
 * @param props.confirmNavigation - Optional sub-nav navigation guard.
 * @param props.actions           - Optional header actions.
 * @param props.children          - Body content.
 * @return The wrapped page element.
 */
function EditorChrome( { videoId, confirmNavigation, actions, children }: ChromeProps ) {
	return (
		<VideoLayout
			videoId={ videoId }
			activeTab="editor"
			breadcrumbLabel={ __( 'Editor', 'jetpack-videopress-pkg' ) }
			actions={ actions }
			confirmNavigation={ confirmNavigation }
		>
			{ children }
		</VideoLayout>
	);
}

type ReadyProps = {
	video: LibraryItem;
};

const historyReducer = withHistory< EditSession, EditSessionAction >( editSessionReducer, {
	clearOn: action => action.type === 'LOAD' || action.type === 'RESET',
	// Selection is not history: clicking around between cuts must not eat
	// undo entries (or clear redo), and a drag that returns to its exact
	// start must commit nothing.
	equals: sessionEditsEqual,
} );

/**
 * The editor once the video is known to be editable: owns the session store,
 * the baseline sync, and the save/restore flows.
 *
 * @param props       - Component props.
 * @param props.video - The video being edited.
 * @return The editor element.
 */
function StudioEditorReady( { video }: ReadyProps ): ReactElement {
	const guid = video.guid;
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const { edits, isError: editsFailed } = useVideoEdits( guid );
	const saveEdits = useSaveVideoEdits();
	const restoreOriginal = useRestoreOriginal();
	// Storyboard/extracted thumbnails for the timeline's filmstrip track;
	// resolves to 'unavailable' (neutral placeholder) when neither works.
	const filmstrip = useFilmstrip( video );

	const [ history, dispatch ] = useReducer( historyReducer, video, v =>
		createHistory( createEditSession( v.durationSeconds * 1000 ) )
	);
	const session = history.present;
	const sessionRef = useRef( session );
	sessionRef.current = session;

	const [ currentMs, setCurrentMs ] = useState( 0 );
	const [ conflict, setConflict ] = useState( false );
	const [ confirmAction, setConfirmAction ] = useState< ConfirmAction | null >( null );
	// Bumped by "Reload latest" so the baseline effect re-runs even when the
	// refetched data is deep-equal to the cache (react-query keeps the same
	// object reference then, e.g. after a conflict raised by a background
	// refetch that already delivered the foreign revision).
	const [ reloadNonce, setReloadNonce ] = useState( 0 );

	const playerRef = useRef< StudioEditorPreviewPlayerHandle >( null );
	// The server state currently LOADed into the session. Dirtiness and the
	// conflict decision are measured against THIS, not against the latest
	// query cache — the two diverge transiently while a newer revision is
	// being fetched (see the baseline effect).
	const [ baseline, setBaseline ] = useState< {
		revision: number;
		operations: EditOperation[];
	} | null >( null );
	// The save/restore we initiated, so its completed revision re-baselines
	// (and notifies) instead of raising a conflict. State (not a ref) because
	// it participates in `locked`: the editor must stay locked through the gap
	// between the POST resolving and the refetch reporting the processing job,
	// or edits made in that gap would be silently LOADed over when the job's
	// revision lands.
	const [ pendingJob, setPendingJob ] = useState< PendingJob | null >( null );
	// Set by "Reload latest": the next fetch re-baselines unconditionally.
	const forceReloadRef = useRef( false );
	// Media duration reported by the <video> element, once metadata loads.
	const metadataDurationRef = useRef< number | null >( null );

	const dirty = useMemo(
		() => ( baseline ? isSessionDirty( session, baseline.operations ) : false ),
		[ session, baseline ]
	);
	const dirtyRef = useRef( dirty );
	dirtyRef.current = dirty;

	const processing = edits?.job.status === 'processing';
	const locked =
		processing || saveEdits.isPending || restoreOriginal.isPending || pendingJob !== null;
	const lockedRef = useRef( locked );
	lockedRef.current = locked;

	/**
	 * Session duration for a (re)baseline: the server's master duration,
	 * shrunk to the element's metadata when the media is physically shorter.
	 * Never extended past the server's value — operations are validated
	 * against it.
	 *
	 * @param serverMs - The server-reported master duration in ms.
	 * @return The duration to load the session with.
	 */
	const effectiveDurationMs = ( serverMs: number ): number => {
		const fallback = serverMs > 0 ? serverMs : Math.round( video.durationSeconds * 1000 );
		const metadata = metadataDurationRef.current;
		return metadata !== null && metadata > 0 && metadata < fallback ? metadata : fallback;
	};
	const effectiveDurationRef = useRef( effectiveDurationMs );
	effectiveDurationRef.current = effectiveDurationMs;

	// A failed job can never deliver its target revision, so a pending job
	// whose target matches a reported failure is terminal: clear it. Keeping
	// it around would let a LATER foreign save that lands on the same revision
	// number (revisions are sequential, and the failed job's slot was never
	// consumed) masquerade as our own job completing — silently LOADing the
	// foreign operations over local edits with a false success notice instead
	// of raising the conflict banner.
	useEffect( () => {
		if (
			pendingJob !== null &&
			edits?.job.status === 'failed' &&
			edits.job.target_revision === pendingJob.targetRevision
		) {
			setPendingJob( null );
		}
	}, [ edits, pendingJob ] );

	// Baseline sync: LOAD the server operations into the session on first
	// fetch, when our own job's revision lands, when a foreign revision lands
	// over a clean session, or when the user asked to reload. A foreign
	// revision under unsaved local edits raises the conflict banner instead.
	useEffect( () => {
		if ( ! edits ) {
			return;
		}
		const isFirstLoad = baseline === null;
		const revisionChanged = ! isFirstLoad && edits.revision !== baseline.revision;
		if ( ! isFirstLoad && ! revisionChanged && ! forceReloadRef.current ) {
			return;
		}

		const expected =
			revisionChanged && pendingJob !== null && edits.revision === pendingJob.targetRevision;

		if ( revisionChanged && ! expected && ! forceReloadRef.current && dirtyRef.current ) {
			setConflict( true );
			return;
		}

		const operations = toEditOperations( edits.operations );
		dispatch( {
			type: 'LOAD',
			operations,
			durationMs: effectiveDurationRef.current( edits.original_duration_ms ),
		} );
		setBaseline( { revision: edits.revision, operations } );
		forceReloadRef.current = false;
		setConflict( false );

		if ( expected ) {
			setPendingJob( null );
			createSuccessNotice(
				pendingJob.kind === 'restore'
					? __( 'Original video restored.', 'jetpack-videopress-pkg' )
					: __( 'Video edits saved.', 'jetpack-videopress-pkg' )
			);
			// Duration/poster may change once the real pipeline transcodes.
			queryClient.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		}
	}, [ edits, baseline, pendingJob, reloadNonce, createSuccessNotice, queryClient ] );

	// Dirty guard, half one: warn on tab close / full navigation.
	useEffect( () => {
		if ( ! dirty ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Chrome still requires returnValue to be set.
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ dirty ] );

	// Dirty guard, half two: confirm in-app navigation via the sub-nav.
	const confirmNavigation = useCallback( () => {
		return (
			! dirtyRef.current ||
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; the sub-nav navigation can't await a custom dialog.
			window.confirm(
				__( 'You have unsaved edits. Leave the editor and discard them?', 'jetpack-videopress-pkg' )
			)
		);
	}, [] );

	// Dirty guard, half three: in-app links (the "VideoPress" breadcrumb and
	// anything else rendered inside this screen's chrome). Router links can't
	// be guarded per-link here — Breadcrumbs renders them internally — so a
	// capture-phase listener on the screen's wrapper intercepts the click
	// before the router's own handler runs; preventDefault makes the router
	// Link bail (it checks event.defaultPrevented) and stops plain anchors.
	const guardLinkClick = useCallback(
		( event: ReactMouseEvent< HTMLElement > ) => {
			// Modified/secondary clicks open new tabs — nothing is discarded.
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) {
				return;
			}
			const anchor = ( event.target as Element ).closest?.( 'a[href]' );
			const target = anchor?.getAttribute( 'target' );
			if ( ! anchor || ( target && target !== '_self' ) ) {
				return;
			}
			if ( ! confirmNavigation() ) {
				// Cancel the navigation, not the click: the router Link bails
				// on defaultPrevented, and plain anchors won't navigate.
				event.preventDefault();
			}
		},
		[ confirmNavigation ]
	);

	// Dirty guard, half four: browser back/forward. The router has already
	// processed the popstate by the time this listener runs, so a decline
	// re-navigates to the editor synchronously — both location updates land in
	// the same render batch, keeping this component (and the dirty session)
	// mounted throughout.
	useEffect( () => {
		if ( ! dirty ) {
			return;
		}
		const onPopState = () => {
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; popstate can't await a custom dialog.
			const leave = window.confirm(
				__( 'You have unsaved edits. Leave the editor and discard them?', 'jetpack-videopress-pkg' )
			);
			if ( ! leave ) {
				navigate( { href: videoTabPath( video.id, 'editor' ) } );
			}
		};
		window.addEventListener( 'popstate', onPopState );
		return () => window.removeEventListener( 'popstate', onPopState );
	}, [ dirty, navigate, video.id ] );

	// While a job is processing the timeline is locked: pointer events are
	// blocked by CSS, and this guard drops the document-level keyboard
	// shortcuts' dispatches.
	const guardedDispatch = useCallback( ( action: HistoryAction< EditSessionAction > ) => {
		if ( ! lockedRef.current ) {
			dispatch( action );
		}
	}, [] );

	const onTimeUpdate = useCallback( ( ms: number ) => setCurrentMs( ms ), [] );
	const onSeek = useCallback( ( ms: number ) => playerRef.current?.seekTo( ms ), [] );
	const onTogglePlay = useCallback( () => playerRef.current?.togglePlay(), [] );

	// Scrubbing pauses playback for the duration of the drag (resuming after,
	// YouTube-style, when it was running). Without this every pointer-move
	// seek fights the playback resolver's own corrective seeks — dragging into
	// a cut or outside the trim window makes the playhead flicker between the
	// pointer and the resolver's target.
	const scrubWasPlayingRef = useRef( false );
	const onScrubStart = useCallback( () => {
		scrubWasPlayingRef.current = playerRef.current?.isPlaying() ?? false;
		playerRef.current?.pause();
	}, [] );
	const onScrubEnd = useCallback( () => {
		if ( scrubWasPlayingRef.current ) {
			scrubWasPlayingRef.current = false;
			playerRef.current?.play();
		}
	}, [] );

	const onDurationChange = useCallback( ( ms: number ) => {
		if ( ms <= 0 ) {
			return;
		}
		metadataDurationRef.current = ms;
		const current = sessionRef.current;
		// Shrink-only rebase (see effectiveDurationMs). Re-LOADing keeps the
		// current operations but clears history/selection — metadata normally
		// arrives before any editing happens.
		if ( current.durationMs === 0 || ms < current.durationMs ) {
			dispatch( {
				type: 'LOAD',
				operations: sessionToOperations( current, current.durationMs ),
				durationMs: ms,
			} );
		}
	}, [] );

	const doSave = useCallback( async () => {
		if ( ! baseline ) {
			return;
		}
		const current = sessionRef.current;
		try {
			const response = await saveEdits.mutateAsync( {
				guid,
				// The revision the session's operations were built against.
				baseRevision: baseline.revision,
				operations: sessionToOperations( current, current.durationMs ),
			} );
			// A null target_revision (contract allows it) would make the job
			// unmatchable — leave nothing pending and let the revision change
			// take the clean-or-conflict path instead of deadlocking the lock.
			if ( typeof response.job.target_revision === 'number' ) {
				setPendingJob( { kind: 'save', targetRevision: response.job.target_revision } );
			}
		} catch ( error ) {
			if ( error instanceof EditsConflictError ) {
				setConflict( true );
			} else {
				createErrorNotice( __( 'Failed to save video edits.', 'jetpack-videopress-pkg' ) );
			}
		}
	}, [ baseline, guid, saveEdits, createErrorNotice ] );

	const doRestore = useCallback( async () => {
		try {
			const response = await restoreOriginal.mutateAsync( { guid } );
			if ( typeof response.job.target_revision === 'number' ) {
				setPendingJob( { kind: 'restore', targetRevision: response.job.target_revision } );
			}
		} catch {
			createErrorNotice( __( 'Failed to restore the original video.', 'jetpack-videopress-pkg' ) );
		}
	}, [ guid, restoreOriginal, createErrorNotice ] );

	// Discard returns to the last loaded baseline (not a pristine full-range
	// session — the baseline may itself contain saved operations).
	const doDiscard = useCallback( () => {
		dispatch( {
			type: 'LOAD',
			operations: baseline?.operations ?? [],
			durationMs: sessionRef.current.durationMs,
		} );
	}, [ baseline ] );

	// Recover from a failed initial GET …/edits (the retry affordance in the
	// error state below).
	const onRetryLoadEdits = useCallback( () => {
		queryClient.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, guid ] } );
	}, [ queryClient, guid ] );

	const onReloadLatest = useCallback( () => {
		forceReloadRef.current = true;
		// The nonce re-runs the baseline effect immediately (re-baselining on
		// whatever revision is cached); the invalidation then fetches anything
		// newer, which auto-baselines because the session is clean afterwards.
		setReloadNonce( nonce => nonce + 1 );
		queryClient.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, guid ] } );
	}, [ queryClient, guid ] );

	const onConfirm = useCallback( () => {
		if ( confirmAction === 'save' ) {
			doSave();
		} else if ( confirmAction === 'discard' ) {
			doDiscard();
		} else if ( confirmAction === 'restore' ) {
			doRestore();
		}
		setConfirmAction( null );
	}, [ confirmAction, doSave, doDiscard, doRestore ] );

	const dialogCopy: Record< ConfirmAction, { title: string; message: string; label: string } > = {
		save: {
			title: __( 'Save edits?', 'jetpack-videopress-pkg' ),
			message: __(
				'Viewers will see the edited video. Your original is kept and can be restored.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Save edits', 'jetpack-videopress-pkg' ),
		},
		discard: {
			title: __( 'Discard changes?', 'jetpack-videopress-pkg' ),
			message: __(
				'Your unsaved edits will be discarded and the editor will return to the last saved version.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Discard changes', 'jetpack-videopress-pkg' ),
		},
		restore: {
			title: __( 'Restore original?', 'jetpack-videopress-pkg' ),
			message: __(
				'All saved edits will be removed and viewers will see the original video again.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Restore original', 'jetpack-videopress-pkg' ),
		},
	};

	// A session without a baseline can be edited but never saved; surface the
	// failure and a retry instead of a silently dead Save button. Errors after
	// the first successful load keep the cached data and don't hit this.
	if ( editsFailed && ! edits ) {
		return (
			<EditorChrome videoId={ video.id }>
				<div className="vp-studio-editor vp-studio-editor__error">
					<Stack direction="column" gap="md" align="center">
						<Text>
							{ __(
								"The editor couldn't load this video's edit state.",
								'jetpack-videopress-pkg'
							) }
						</Text>
						<Button variant="outline" onClick={ onRetryLoadEdits }>
							{ __( 'Try again', 'jetpack-videopress-pkg' ) }
						</Button>
					</Stack>
				</div>
			</EditorChrome>
		);
	}

	return (
		// display:contents keeps the wrapper out of layout; it exists only to
		// give the link guard a capture-phase hook over the whole chrome
		// (breadcrumbs included).

		<div style={ { display: 'contents' } } onClickCapture={ guardLinkClick }>
			<EditorChrome
				videoId={ video.id }
				confirmNavigation={ confirmNavigation }
				actions={
					<StudioEditorHeaderActions
						canUndo={ ! locked && canUndo( history, sessionEditsEqual ) }
						canRedo={ ! locked && canRedo( history ) }
						onUndo={ () => guardedDispatch( { type: 'UNDO' } ) }
						onRedo={ () => guardedDispatch( { type: 'REDO' } ) }
						canDiscard={ dirty && ! locked }
						onDiscard={ () => setConfirmAction( 'discard' ) }
						canSave={ dirty && ! locked && ! conflict && baseline !== null }
						onSave={ () => setConfirmAction( 'save' ) }
						canRestoreOriginal={ Boolean( edits?.can_restore_original ) && ! locked && ! conflict }
						onRestoreOriginal={ () => setConfirmAction( 'restore' ) }
					/>
				}
			>
				<div className="vp-studio-editor">
					<StudioEditorStatusBanner
						job={ edits?.job }
						conflict={ conflict }
						onRetry={ doSave }
						onReloadLatest={ onReloadLatest }
					/>
					<div className="vp-studio-editor__body">
						<StudioEditorOperationsPanel />
						<div className="vp-studio-editor__main">
							<StudioEditorPreviewPlayer
								ref={ playerRef }
								video={ video }
								session={ session }
								onTimeUpdate={ onTimeUpdate }
								onDurationChange={ onDurationChange }
							/>
							<div
								className={
									'vp-studio-editor__timeline' +
									( locked ? ' vp-studio-editor__timeline--locked' : '' )
								}
								data-testid="studio-editor-timeline-lock"
								aria-busy={ locked || undefined }
							>
								<StudioEditorTimeline
									session={ session }
									dispatch={ guardedDispatch }
									currentMs={ currentMs }
									onSeek={ onSeek }
									onTogglePlay={ onTogglePlay }
									onScrubStart={ onScrubStart }
									onScrubEnd={ onScrubEnd }
									shortcutsEnabled={ confirmAction === null }
									filmstrip={ filmstrip }
								/>
							</div>
						</div>
					</div>
				</div>
				{ confirmAction !== null && (
					<StudioEditorConfirmDialog
						isOpen
						title={ dialogCopy[ confirmAction ].title }
						message={ dialogCopy[ confirmAction ].message }
						confirmLabel={ dialogCopy[ confirmAction ].label }
						onConfirm={ onConfirm }
						onCancel={ () => setConfirmAction( null ) }
					/>
				) }
			</EditorChrome>
		</div>
	);
}

type Props = {
	videoId: string;
};

/**
 * The Studio editor screen. Resolves the video first: loading and edge
 * states (missing, not a VideoPress video, still processing) render inside
 * the same Editor-tab chrome; the full editor mounts once the video is
 * editable.
 *
 * @param props         - Component props.
 * @param props.videoId - The video's attachment id from the route.
 * @return The screen element.
 */
export default function StudioEditorScreen( { videoId }: Props ): ReactElement {
	const { video, isLoading } = useVideo( videoId );

	if ( isLoading ) {
		return (
			<EditorChrome videoId={ videoId }>
				<div
					className="vp-studio-editor vp-studio-editor__loading"
					data-testid="studio-editor-loading"
					aria-busy="true"
				/>
			</EditorChrome>
		);
	}

	if ( ! video || ! isEditableVideo( video ) ) {
		return (
			<EditorChrome videoId={ videoId }>
				<div className="vp-studio-editor vp-studio-editor__not-found">
					<Stack direction="column" gap="md" align="center">
						<Text>{ __( "We couldn't find that video.", 'jetpack-videopress-pkg' ) }</Text>
						<Link to="/library">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
					</Stack>
				</div>
			</EditorChrome>
		);
	}

	if ( video.isProcessing ) {
		// useVideo keeps polling while processing, so the editor appears on
		// its own once the backend finishes.
		return (
			<EditorChrome videoId={ videoId }>
				<div className="vp-studio-editor vp-studio-editor__processing">
					<Text>
						{ __(
							'This video is still processing. The editor will open once it finishes.',
							'jetpack-videopress-pkg'
						) }
					</Text>
				</div>
			</EditorChrome>
		);
	}

	return <StudioEditorReady video={ video } />;
}
