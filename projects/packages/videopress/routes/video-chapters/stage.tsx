/**
 * The Chapters tab for a single video: the shared chapters editor (preview
 * player over the chapters timeline) hosted standalone, saving through the
 * description meta POST + fire-and-notice VTT sync.
 *
 * State model: one history-wrapped chapters store (use-chapters-store) backs
 * the editing surface — the video description is the single source of truth
 * for chapters, and the VTT track is derived downstream by `syncChapters`.
 * A manually uploaded chapters VTT must never be edited here, so a probe
 * runs once per mount: while it is unresolved the tool is LOCKED (busy),
 * not read-only — edits made in the probe window could dirty a session that
 * a late 'manual' result freezes un-editable, with Save still armed to
 * rewrite a manually-managed description (the write-time guard protects the
 * VTT file, not the description lines). 'manual' turns the tool read-only.
 * The probe fails open ('editable') — the save-time sync re-checks the
 * guard authoritatively.
 *
 * Save/Discard enablement, the beforeunload guard, and the in-app
 * navigation guards (sub-nav, links, browser back/forward) all key off the
 * session being effectively dirty (dirty AND probed 'editable').
 */
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Button as IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { redo as redoIcon, undo as undoIcon } from '@wordpress/icons';
import { Link, useNavigate, useParams } from '@wordpress/route';
import { Button, Dialog, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChaptersTimeline from '../../src/client/components/chapters-editor/chapters/chapters-timeline';
import {
	chaptersEditsEqual,
	chaptersToRows,
} from '../../src/client/components/chapters-editor/state/chapters-session';
import {
	canRedo as canRedoHistory,
	canUndo as canUndoHistory,
} from '../../src/client/components/chapters-editor/state/history';
import { useChaptersStore } from '../../src/client/components/chapters-editor/use-chapters-store';
import { serializeDescription } from '../../src/client/utils/video-chapters/description';
import { probeManualTrack } from '../../src/client/utils/video-chapters/probe-manual-track';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import ChaptersPreviewPlayer from '../../src/dashboard/components/video-chapters/preview-player';
import VideoLayout from '../../src/dashboard/components/video-layout';
import { videoTabPath } from '../../src/dashboard/components/video-nav';
import { useUpdateChapters } from '../../src/dashboard/hooks/use-update-chapters';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useVideo } from '../../src/dashboard/hooks/use-video';
import './style.scss';
import type { ChaptersPreviewPlayerHandle } from '../../src/dashboard/components/video-chapters/preview-player';
import type { LibraryItem } from '../../src/dashboard/types/library';
import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from 'react';

/**
 * Whether the Chapters tab can operate on this attachment: a VideoPress
 * video with a guid (the tracks API is keyed by guid) whose upload didn't
 * fail.
 *
 * @param video - The library item.
 * @return Whether the Chapters tab applies.
 */
function isChaptersEligible( video: LibraryItem ): boolean {
	return video.type === 'videopress' && Boolean( video.guid ) && video.upload.status !== 'failed';
}

type ChromeProps = {
	videoId: string;
	confirmNavigation?: () => boolean;
	actions?: ReactNode;
	breadcrumbLabel?: string;
	children: ReactNode;
};

/**
 * The tab's page chrome: VideoLayout pinned to the Chapters tab.
 *
 * @param props                   - Component props.
 * @param props.videoId           - The video's attachment id.
 * @param props.confirmNavigation - Optional sub-nav navigation guard.
 * @param props.actions           - Optional header actions.
 * @param props.breadcrumbLabel   - Breadcrumb leaf; the ready screen passes
 *                                the video title, states without one fall
 *                                back to "Chapters".
 * @param props.children          - Body content.
 * @return The wrapped page element.
 */
function ChaptersChrome( {
	videoId,
	confirmNavigation,
	actions,
	breadcrumbLabel,
	children,
}: ChromeProps ) {
	return (
		<VideoLayout
			videoId={ videoId }
			activeTab="chapters"
			breadcrumbLabel={ breadcrumbLabel ?? __( 'Chapters', 'jetpack-videopress-pkg' ) }
			actions={ actions }
			confirmNavigation={ confirmNavigation }
		>
			{ children }
		</VideoLayout>
	);
}

type HeaderActionsProps = {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
	canDiscard: boolean;
	onDiscard: () => void;
	canSave: boolean;
	onSave: () => void;
};

/**
 * Actions slot for the AdminPage header on the Chapters tab: Undo / Redo
 * icon buttons, the outline Discard button, and the primary Save button.
 * All enable/disable logic lives in the screen; this component is purely
 * presentational.
 *
 * @param props            - Component props.
 * @param props.canUndo    - Whether an undo entry is available.
 * @param props.canRedo    - Whether a redo entry is available.
 * @param props.onUndo     - Called when Undo is activated.
 * @param props.onRedo     - Called when Redo is activated.
 * @param props.canDiscard - Whether there are unsaved edits to discard.
 * @param props.onDiscard  - Called when Discard is activated.
 * @param props.canSave    - Whether Save is actionable (dirty, save idle).
 * @param props.onSave     - Called when Save is activated.
 * @return The header-actions element.
 */
function ChaptersHeaderActions( {
	canUndo,
	canRedo,
	onUndo,
	onRedo,
	canDiscard,
	onDiscard,
	canSave,
	onSave,
}: HeaderActionsProps ): ReactElement {
	return (
		<Stack direction="row" gap="sm" align="center" className="vp-chapters-tokens">
			<IconButton
				icon={ undoIcon }
				label={ __( 'Undo', 'jetpack-videopress-pkg' ) }
				disabled={ ! canUndo }
				accessibleWhenDisabled
				onClick={ onUndo }
			/>
			<IconButton
				icon={ redoIcon }
				label={ __( 'Redo', 'jetpack-videopress-pkg' ) }
				disabled={ ! canRedo }
				accessibleWhenDisabled
				onClick={ onRedo }
			/>
			<span className="vp-video-chapters__header-divider" aria-hidden="true" />
			<Button variant="outline" disabled={ ! canDiscard } onClick={ onDiscard }>
				{ __( 'Discard changes', 'jetpack-videopress-pkg' ) }
			</Button>
			<Button disabled={ ! canSave } onClick={ onSave }>
				{ __( 'Save', 'jetpack-videopress-pkg' ) }
			</Button>
		</Stack>
	);
}

type ConfirmDiscardProps = {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Confirmation dialog for discarding unsaved chapter changes.
 *
 * @param props           - Component props.
 * @param props.isOpen    - Whether the dialog is open.
 * @param props.onConfirm - Called when the user confirms the discard.
 * @param props.onCancel  - Called when the user cancels or dismisses.
 * @return The dialog element.
 */
function ConfirmDiscardDialog( {
	isOpen,
	onConfirm,
	onCancel,
}: ConfirmDiscardProps ): ReactElement {
	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					onCancel();
				}
			} }
		>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Discard changes?', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ /*
				 * Dialog.Popup is an unpadded flex column; body padding comes
				 * from the Dialog.Content region, which also owns scrolling
				 * when the body outgrows the popup.
				 */ }
				<Dialog.Content>
					<Text>
						{ __(
							'Your unsaved chapter changes will be discarded and the chapters will return to the last saved version.',
							'jetpack-videopress-pkg'
						) }
					</Text>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" onClick={ onCancel }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button onClick={ onConfirm }>
						{ __( 'Discard changes', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

type ReadyProps = {
	video: LibraryItem;
};

/**
 * The Chapters tab once the video is known to be eligible: owns the
 * chapters store, the manual-VTT probe, and the save/discard flows.
 *
 * @param props       - Component props.
 * @param props.video - The video whose chapters are edited.
 * @return The screen element.
 */
function ChaptersReady( { video }: ReadyProps ): ReactElement {
	const navigate = useNavigate();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	// The two halves of Save: the description meta POST, then the
	// fire-and-notice VTT sync (same pair the Details tab saves through).
	const { mutateAsync: saveVideoMeta, isPending: metaSavePending } = useUpdateVideoMeta();
	const { syncChapters } = useUpdateChapters();

	const [ currentMs, setCurrentMs ] = useState( 0 );
	// Mirrored from the preview player for the timeline toolbar's transport
	// button (the transport lives in the timeline toolbar).
	const [ playing, setPlaying ] = useState( false );
	const [ confirmDiscardOpen, setConfirmDiscardOpen ] = useState( false );

	const playerRef = useRef< ChaptersPreviewPlayerHandle >( null );
	const videoRef = useRef( video );
	videoRef.current = video;

	// Manual-VTT probe, once per mount: a manually uploaded chapters track
	// must never be edited here, so 'manual' turns the tool read-only. While
	// the probe runs the tool is locked-busy, not editable — see
	// chaptersLocked below. Fails open ('editable') — the save-time sync
	// re-checks the guard authoritatively.
	const [ chaptersProbe, setChaptersProbe ] = useState< 'unprobed' | 'manual' | 'editable' >(
		'unprobed'
	);
	useEffect( () => {
		// No cancellation: setState after unmount is a safe no-op, and the
		// result must survive re-renders during the probe.
		probeManualTrack( videoRef.current ).then( setChaptersProbe );
	}, [] );

	// While the manual-VTT probe is unresolved the tool is LOCKED (busy),
	// not read-only: edits made in the probe window could dirty a session
	// that a late 'manual' result freezes un-editable, with Save still armed
	// to rewrite a manually-managed description (the write-time guard
	// protects the VTT file, not the description lines). The in-flight meta
	// save locks for the same reason.
	const chaptersLocked = metaSavePending || chaptersProbe === 'unprobed';

	// The chapters store: a history-wrapped reducer. Chapters live on the
	// OUTPUT video, so its duration is the attachment's.
	const chapters = useChaptersStore( {
		description: video.description,
		durationMs: Math.round( video.durationSeconds * 1000 ),
		locked: chaptersLocked,
	} );
	const { markSaved: markChaptersSaved, discard: discardChapters } = chapters;

	// Chapters dirt participates in Save and the navigation guards only once
	// the probe has landed 'editable': the pending-probe lock means user dirt
	// cannot arise earlier, and a 'manual' session must stay inert —
	// defense-in-depth for the description rewrite, which the write-time
	// guard does not cover.
	const effectiveDirty = chapters.chaptersDirty && chaptersProbe === 'editable';
	const effectiveDirtyRef = useRef( effectiveDirty );
	effectiveDirtyRef.current = effectiveDirty;
	const chaptersSessionRef = useRef( chapters.session );
	chaptersSessionRef.current = chapters.session;

	// Dirty guard, half one: warn on tab close / full navigation.
	useEffect( () => {
		if ( ! effectiveDirty ) {
			return;
		}
		const onBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Chrome still requires returnValue to be set.
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', onBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', onBeforeUnload );
	}, [ effectiveDirty ] );

	// Dirty guard, half two: confirm in-app navigation via the sub-nav.
	const confirmNavigation = useCallback( () => {
		return (
			! effectiveDirtyRef.current ||
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; the sub-nav navigation can't await a custom dialog.
			window.confirm(
				__(
					'You have unsaved chapter changes. Leave this page and discard them?',
					'jetpack-videopress-pkg'
				)
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
	// re-navigates to the Chapters tab synchronously — both location updates
	// land in the same render batch, keeping this component (and the dirty
	// session) mounted throughout.
	useEffect( () => {
		if ( ! effectiveDirty ) {
			return;
		}
		const onPopState = () => {
			// eslint-disable-next-line no-alert -- deliberate synchronous guard; popstate can't await a custom dialog.
			const leave = window.confirm(
				__(
					'You have unsaved chapter changes. Leave this page and discard them?',
					'jetpack-videopress-pkg'
				)
			);
			if ( ! leave ) {
				navigate( { href: videoTabPath( video.id, 'chapters' ) } );
			}
		};
		window.addEventListener( 'popstate', onPopState );
		return () => window.removeEventListener( 'popstate', onPopState );
	}, [ effectiveDirty, navigate, video.id ] );

	const onTimeUpdate = useCallback( ( ms: number ) => setCurrentMs( ms ), [] );
	const onSeek = useCallback( ( ms: number ) => playerRef.current?.seekTo( ms ), [] );
	const onTogglePlay = useCallback( () => playerRef.current?.togglePlay(), [] );

	// Scrubbing pauses playback for the duration of the drag (resuming
	// after, YouTube-style, when it was running), so every pointer-move seek
	// lands on a paused element instead of fighting ongoing playback.
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

	// Save: rewrite the description's chapter lines (byte-preserving the
	// prose) and POST the meta update. Only after that succeeds does the VTT
	// sync run — fire-and-notice, since syncChapters never rejects (failures
	// raise a warning notice inside the hook) — and the store re-baselines
	// on the description we just wrote, so the later media refetch is a
	// no-op. On failure the session stays dirty for another attempt.
	const doSaveChapters = useCallback( async () => {
		const item = videoRef.current;
		const nextDescription = serializeDescription(
			item.description,
			chaptersToRows( chaptersSessionRef.current )
		);
		try {
			await saveVideoMeta( { id: item.id, patch: { description: nextDescription } } );
		} catch {
			createErrorNotice( __( 'Failed to save chapters.', 'jetpack-videopress-pkg' ) );
			return;
		}
		void syncChapters( item, nextDescription );
		markChaptersSaved( nextDescription );
		createSuccessNotice( __( 'Chapters saved.', 'jetpack-videopress-pkg' ) );
	}, [ saveVideoMeta, syncChapters, markChaptersSaved, createSuccessNotice, createErrorNotice ] );

	// Discard returns the session to its last loaded baseline via a confirm
	// dialog; the dialog only opens while effectively dirty (LOAD clears the
	// tool's history and must not run on a clean store).
	const onConfirmDiscard = useCallback( () => {
		discardChapters();
		setConfirmDiscardOpen( false );
	}, [ discardChapters ] );

	return (
		// display:contents keeps the wrapper out of layout; it exists only to
		// give the link guard a capture-phase hook over the whole chrome
		// (breadcrumbs included).

		<div style={ { display: 'contents' } } onClickCapture={ guardLinkClick }>
			<ChaptersChrome
				videoId={ video.id }
				breadcrumbLabel={ video.title }
				confirmNavigation={ confirmNavigation }
				actions={
					<ChaptersHeaderActions
						canUndo={ ! chaptersLocked && canUndoHistory( chapters.history, chaptersEditsEqual ) }
						canRedo={ ! chaptersLocked && canRedoHistory( chapters.history ) }
						onUndo={ () => chapters.dispatch( { type: 'UNDO' } ) }
						onRedo={ () => chapters.dispatch( { type: 'REDO' } ) }
						canDiscard={ effectiveDirty && ! metaSavePending }
						onDiscard={ () => setConfirmDiscardOpen( true ) }
						canSave={ effectiveDirty && ! metaSavePending }
						onSave={ () => void doSaveChapters() }
					/>
				}
			>
				<div className="vp-video-chapters vp-chapters-tokens">
					<ChaptersPreviewPlayer
						ref={ playerRef }
						video={ video }
						onTimeUpdate={ onTimeUpdate }
						onPlayingChange={ setPlaying }
					/>
					<div
						className={
							'vp-video-chapters__timeline' +
							( chaptersLocked ? ' vp-video-chapters__timeline--locked' : '' )
						}
						data-testid="chapters-timeline-lock"
						aria-busy={ chaptersLocked || undefined }
					>
						{ /* The timeline owns the document-level shortcuts instance
						     (space, arrows, Delete, mod+Z); it detaches while the
						     discard confirm dialog is open. */ }
						<ChaptersTimeline
							session={ chapters.session }
							dispatch={ chapters.dispatch }
							currentMs={ currentMs }
							onSeek={ onSeek }
							onTogglePlay={ onTogglePlay }
							playing={ playing }
							locked={ chaptersLocked }
							onScrubStart={ onScrubStart }
							onScrubEnd={ onScrubEnd }
							shortcutsEnabled={ ! confirmDiscardOpen }
							readOnly={ chaptersProbe === 'manual' }
						/>
					</div>
				</div>
				{ confirmDiscardOpen && (
					<ConfirmDiscardDialog
						isOpen
						onConfirm={ onConfirmDiscard }
						onCancel={ () => setConfirmDiscardOpen( false ) }
					/>
				) }
			</ChaptersChrome>
		</div>
	);
}

/**
 * The Chapters tab screen. Resolves the video first: loading and edge
 * states (missing, not a VideoPress video, still processing) render inside
 * the same Chapters-tab chrome; the editor mounts once the video is
 * eligible.
 *
 * @param props    - Component props.
 * @param props.id - The video's attachment id from the route.
 * @return The screen element.
 */
function ChaptersRoute( { id }: { id: string } ): ReactElement {
	const { video, isLoading } = useVideo( id );

	if ( isLoading ) {
		return (
			<ChaptersChrome videoId={ id }>
				<div
					className="vp-video-chapters vp-video-chapters__loading"
					data-testid="chapters-loading"
					aria-busy="true"
				/>
			</ChaptersChrome>
		);
	}

	if ( ! video || ! isChaptersEligible( video ) ) {
		return (
			<ChaptersChrome videoId={ id }>
				<div className="vp-video-chapters vp-video-chapters__not-found">
					<Stack direction="column" gap="md" align="center">
						<Text>{ __( "We couldn't find that video.", 'jetpack-videopress-pkg' ) }</Text>
						<Link to="/">{ __( 'Back to Library', 'jetpack-videopress-pkg' ) }</Link>
					</Stack>
				</div>
			</ChaptersChrome>
		);
	}

	if ( video.isProcessing || video.durationSeconds <= 0 ) {
		// A video without a known duration can't host a timeline. useVideo
		// keeps polling while processing, so the editor appears on its own
		// once the backend finishes.
		return (
			<ChaptersChrome videoId={ id } breadcrumbLabel={ video.title || undefined }>
				<div className="vp-video-chapters vp-video-chapters__processing">
					<Text>
						{ __(
							'This video is still processing. Chapters will be available once it finishes.',
							'jetpack-videopress-pkg'
						) }
					</Text>
				</div>
			</ChaptersChrome>
		);
	}

	return <ChaptersReady video={ video } />;
}

const StageInner = () => {
	const { id } = useParams( { from: '/video/$id/chapters' } );

	return <ChaptersRoute id={ id } />;
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
