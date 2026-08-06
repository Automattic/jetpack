/**
 * External dependencies
 */
import { Button, Modal, SnackbarList } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { close, redo as redoIcon, undo as undoIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useMediaDataUpdate from '../../block-editor/hooks/use-video-data-update';
import { fetchVideoItem } from '../../lib/fetch-video-item';
import { serializeDescription, validateRows } from '../../utils/video-chapters/description';
import { pickPlaybackUrl } from '../../utils/video-chapters/pick-playback-url';
import { probeManualTrack } from '../../utils/video-chapters/probe-manual-track';
import { syncChapters } from '../../utils/video-chapters/sync-chapters';
import ConfirmationOverlay from '../caption-manager-modal/confirmation-overlay';
import { useCaptionSnackbars } from '../caption-manager-modal/use-caption-snackbars';
import ChaptersTimeline from '../chapters-editor/chapters/chapters-timeline';
import ChaptersPreviewPlayer from '../chapters-editor/preview/preview-player';
import { usePreviewTransport } from '../chapters-editor/preview/use-preview-transport';
import { chaptersEditsEqual, chaptersToRows } from '../chapters-editor/state/chapters-session';
import { canRedo, canUndo } from '../chapters-editor/state/history';
import { isExemptTarget } from '../chapters-editor/timeline/use-keyboard-shortcuts';
import { useChaptersStore } from '../chapters-editor/use-chapters-store';
import './style.scss';
/**
 * Types
 */
import type { ChapterManagerModalProps } from './types';
import type { KeyboardEvent, ReactElement } from 'react';

type ConfirmationState = {
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
};

/**
 * What the on-open item fetch established about the video: still loading,
 * ready to edit (duration known), or unavailable (fetch failed, or the video
 * reports no duration yet — most likely still processing).
 */
type ItemState = 'loading' | 'ready' | 'unavailable';

/**
 * Shared VideoPress chapter manager modal.
 *
 * The video description is the single source of truth for chapters: the
 * modal parses it into the shared chapters-editor session, and Save
 * serializes the session back into the description (byte-preserving the
 * prose), POSTs the description meta FIRST, and only then fires the
 * chapters-VTT sync — fire-and-notice, exactly like the dashboard's save
 * flow, so a track failure can never fail (or block) the description save.
 *
 * On open the modal makes ONE `fetchVideoItem` request: it supplies the
 * duration the timeline needs (the timeline isn't mounted until the
 * duration is known) plus the H.264 rendition URL the shared preview player
 * plays, and is reused by the manual-VTT probe. The editor stays LOCKED
 * until the probe settles — edits made in the probe window could otherwise
 * arm a Save against a manually-managed description — and a 'manual' result
 * turns the editor read-only (the timeline renders its own explanatory
 * notice).
 *
 * Close discipline follows the caption manager: WordPress's Modal plays its
 * exit animation before consulting `onRequestClose`, so a vetoed close
 * (unsaved edits) would flash the modal away and back. The built-in dismiss
 * affordances are disabled in favor of an own close button and an Escape
 * intercept on the body, closing is refused outright while a save is in
 * flight, and unsaved edits go through an in-modal discard confirmation.
 *
 * @param props              - Component props (see {@link ChapterManagerModalProps}).
 * @param props.isOpen       - Whether the modal is open.
 * @param props.guid         - VideoPress GUID.
 * @param props.attachmentId - Attachment id of the video, for the description meta POST.
 * @param props.description  - The video description (the chapters source of truth).
 * @param props.title        - Optional video title.
 * @param props.isPrivate    - Whether the video is private, so previews and fetches need a playback token.
 * @param props.onClose      - Close handler.
 * @param props.onSaved      - Called with the just-saved description after the meta POST succeeds.
 * @return The modal, or null while closed.
 */
export default function ChapterManagerModal( {
	isOpen,
	guid,
	attachmentId,
	description,
	title,
	isPrivate = false,
	onClose,
	onSaved,
}: ChapterManagerModalProps ): ReactElement | null {
	// The preview player ↔ timeline wiring (playhead, play state, scrub
	// pause/resume), shared with the dashboard's Editor tab.
	const {
		playerRef,
		currentMs,
		playing,
		onTimeUpdate,
		onPlayingChange,
		onSeek,
		onTogglePlay,
		onScrubStart,
		onScrubEnd,
		reset: resetPlayback,
	} = usePreviewTransport();

	const [ itemState, setItemState ] = useState< ItemState >( 'loading' );
	const [ itemDurationMs, setItemDurationMs ] = useState< number | null >( null );
	// The best H.264 rendition from the on-open item fetch — what the shared
	// preview player plays (the original upload may not decode in browsers).
	const [ playbackUrl, setPlaybackUrl ] = useState< string | undefined >( undefined );
	/*
	 * Manual-VTT probe, once per open: a manually uploaded chapters track
	 * must never be edited here, so 'manual' turns the editor read-only.
	 * While the probe runs the editor is locked-busy, not editable — edits
	 * made in the probe window could dirty a session that a late 'manual'
	 * result freezes un-editable, with Save still armed to rewrite a
	 * manually-managed description (the write-time guard in `syncChapters`
	 * protects the VTT file, not the description lines). Fails open
	 * ('editable') — the save-time sync re-checks the guard authoritatively.
	 */
	const [ probe, setProbe ] = useState< 'unprobed' | 'manual' | 'editable' >( 'unprobed' );
	const [ metaSavePending, setMetaSavePending ] = useState( false );
	const [ confirmation, setConfirmation ] = useState< ConfirmationState | null >( null );
	// Transient snackbars for outcomes and async failures; see use-caption-snackbars.ts.
	const { snackbars, notify, removeSnackbar, clearSnackbars } = useCaptionSnackbars();

	const chaptersLocked = metaSavePending || probe === 'unprobed' || itemState !== 'ready';
	const readOnly = probe === 'manual';

	/*
	 * The chapters store mounts with a zero duration and re-LOADs (while
	 * clean, which the lock guarantees) once the item fetch delivers the real
	 * one; the timeline itself is only mounted once the duration is known.
	 */
	const { history, session, dispatch, chaptersDirty, markSaved, discard } = useChaptersStore( {
		description,
		durationMs: itemDurationMs ?? 0,
		locked: chaptersLocked,
	} );

	// Chapters dirt participates in Save/Discard and the guards only once the
	// probe has landed 'editable': the pending-probe lock means user dirt
	// cannot arise earlier, and a 'manual' session must stay inert —
	// defense-in-depth for the description rewrite, which the write-time
	// guard does not cover.
	const effectiveDirty = chaptersDirty && probe === 'editable' && itemState === 'ready';

	// On-open reset + the single item fetch feeding duration, the playback
	// URL, and the manual-VTT probe.
	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		setConfirmation( null );
		clearSnackbars();
		resetPlayback();
		setItemState( 'loading' );
		setItemDurationMs( null );
		setPlaybackUrl( undefined );
		setProbe( 'unprobed' );

		let isCurrent = true;
		( async () => {
			let item;
			try {
				item = await fetchVideoItem( { guid, isPrivate } );
			} catch {
				if ( isCurrent ) {
					setItemState( 'unavailable' );
				}
				return;
			}
			if ( ! isCurrent ) {
				return;
			}

			// The v1.1 item carries the same `file_url_base`/`files` shape as
			// `media_details.videopress`, so it feeds the rendition picker too.
			setPlaybackUrl( pickPlaybackUrl( item ) );

			// The v1.1 videos endpoint reports the duration in MILLISECONDS.
			const durationMs = Math.round( Number( item?.duration ) );
			if ( ! ( durationMs > 0 ) ) {
				// No duration, no timeline — the video is most likely still processing.
				setItemState( 'unavailable' );
				return;
			}
			setItemDurationMs( durationMs );
			setItemState( 'ready' );

			// Reuse the already-fetched item instead of fetching it twice.
			// The probe never rejects (it fails open).
			const result = await probeManualTrack( { guid, isPrivate }, { item } );
			if ( isCurrent ) {
				setProbe( result );
			}
		} )();

		return () => {
			isCurrent = false;
		};
	}, [ isOpen, guid, isPrivate, clearSnackbars, resetPlayback ] );

	/*
	 * The discard confirmation only guards in-modal closing; this guards the
	 * rest — closing the tab or navigating the whole page away with unsaved
	 * chapter edits.
	 */
	useEffect( () => {
		if ( ! isOpen || ! effectiveDirty ) {
			return;
		}

		const warnBeforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Chrome requires returnValue to be set for the prompt to show.
			event.returnValue = '';
		};

		window.addEventListener( 'beforeunload', warnBeforeUnload );
		return () => window.removeEventListener( 'beforeunload', warnBeforeUnload );
	}, [ isOpen, effectiveDirty ] );

	/*
	 * Any edit that unmounts the focused control — removing a chapter,
	 * Discard, Undo — drops focus onto <body>, which is OUTSIDE the Modal's
	 * portal: the Escape intercept below (a React handler on this subtree)
	 * never sees the keydown, so the modal's only remaining dismiss
	 * affordance dies, and a screen reader loses its place entirely. Take
	 * focus back to the workspace — the editing area the vanished control
	 * lived in, and a descendant of the body, so the shortcut/Escape handler
	 * still runs. (The body itself is `display: contents`, i.e. box-less and
	 * therefore not focusable in a browser, so it can't be the target.)
	 * Deliberately dependency-free: any render can be the one that unmounted
	 * the focused element, and the guard is a no-op whenever focus is still
	 * somewhere real. The confirmation overlay manages its own focus, so it
	 * is left alone while it is up.
	 */
	const workspaceRef = useRef< HTMLDivElement >( null );
	useEffect( () => {
		const workspace = workspaceRef.current;
		if ( ! isOpen || confirmation !== null || ! workspace ) {
			return;
		}
		const { activeElement, body } = workspace.ownerDocument;
		if ( activeElement === body ) {
			workspace.focus();
		}
	} );

	const updateMediaItem = useMediaDataUpdate( attachmentId );

	/*
	 * Save, meta FIRST: serialize the session into the description and POST
	 * the description meta; only after that succeeds does the VTT sync run —
	 * fire-and-notice, since `syncChapters` never rejects (failures surface
	 * through the warning snackbar) — then the store re-baselines on the
	 * description just written. On failure the session stays dirty for
	 * another attempt and the host is not notified.
	 *
	 * The description is saved whatever the chapters look like — it is the
	 * source of truth and holds the user's prose — but the derived VTT is
	 * only (re)generated for a set that passes `validateRows`; an invalid one
	 * makes `syncChapters` delete the auto-generated track instead. That
	 * verdict is computed here, synchronously off the same rows, so the
	 * outcome message can say which of the two just happened rather than
	 * claiming success while the player's chapter menu goes empty.
	 */
	const doSave = useCallback( async () => {
		if ( itemDurationMs === null ) {
			return;
		}

		const rows = chaptersToRows( session );
		const next = serializeDescription( description, rows );
		// The v1.1 item reports the duration in ms; validateRows wants seconds.
		const chaptersValid = validateRows( rows, itemDurationMs / 1000 ).isValid;
		setMetaSavePending( true );
		try {
			await updateMediaItem( { description: next } );
		} catch {
			notify( __( 'Failed to save chapters.', 'jetpack-videopress-pkg' ) );
			return;
		} finally {
			setMetaSavePending( false );
		}

		void syncChapters(
			{ guid, isPrivate, durationSeconds: itemDurationMs / 1000 },
			next,
			// Surfaces "Video chapters could not be updated." on sync failure.
			{ onWarning: notify }
		);
		markSaved( next );
		// Outside the try/catch: a host-callback error must not read as a
		// save failure (which would provoke a pointless retry).
		onSaved( next );
		/*
		 * An if/else is NOT enough on its own: both branches call `notify` with
		 * a two-argument `__()`, so production Terser merges them into
		 * `__( cond ? 'a' : 'b', domain )` and the i18n build check rejects the
		 * non-literal msgid. The branches must differ in CALLEE, so the warning
		 * goes through `_x()` — which is also why the same context is used in
		 * the dashboard host, keeping this one catalog entry rather than two.
		 */
		if ( chaptersValid ) {
			notify( __( 'Chapters saved.', 'jetpack-videopress-pkg' ) );
		} else {
			notify(
				_x(
					'Chapters saved to the description, but they won’t appear in the player until they meet the requirements.',
					'chapters save outcome',
					'jetpack-videopress-pkg'
				)
			);
		}
	}, [
		description,
		guid,
		isPrivate,
		itemDurationMs,
		markSaved,
		notify,
		onSaved,
		session,
		updateMediaItem,
	] );

	// Raise the discard confirmation; `onConfirm` is what the unsaved edits are
	// being dropped FOR — resetting the session (Discard changes) or closing
	// the modal outright.
	const confirmDiscard = useCallback( ( onConfirm: () => void ) => {
		setConfirmation( {
			message: __( 'Discard unsaved chapter changes?', 'jetpack-videopress-pkg' ),
			confirmLabel: __( 'Discard', 'jetpack-videopress-pkg' ),
			onConfirm,
		} );
	}, [] );

	const requestDiscard = useCallback(
		() => confirmDiscard( discard ),
		[ confirmDiscard, discard ]
	);

	const handleRequestClose = useCallback( () => {
		// A save in flight must not be raced by a close: an accepted discard
		// would still deliver the save's `onSaved` to an unmounted host flow.
		if ( metaSavePending ) {
			return;
		}
		if ( effectiveDirty ) {
			confirmDiscard( onClose );
			return;
		}
		onClose();
	}, [ confirmDiscard, effectiveDirty, metaSavePending, onClose ] );

	/*
	 * Keyboard shortcuts live HERE, as a React handler on the modal body,
	 * instead of the timeline's document-level listener
	 * (`shortcutsEnabled={ false }` below): document-level listeners inside
	 * the block editor fight Gutenberg's own undo/shortcut handling. Escape
	 * is handled first, before the Modal's own handler — the Modal plays its
	 * exit animation before asking `onRequestClose`, so a vetoed close would
	 * flash the modal closed and open again. The timeline shell's
	 * element-level playhead arrows are unaffected.
	 */
	const handleBodyKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key === 'Escape' && ! event.defaultPrevented ) {
				event.preventDefault();
				handleRequestClose();
				return;
			}
			if ( confirmation !== null || event.defaultPrevented || isExemptTarget( event.target ) ) {
				return;
			}

			const mod = event.metaKey || event.ctrlKey;
			if ( mod ) {
				if ( event.key.toLowerCase() === 'z' && ! event.altKey ) {
					event.preventDefault();
					event.stopPropagation();
					if ( event.shiftKey ) {
						dispatch( { type: 'REDO' } );
					} else {
						dispatch( { type: 'UNDO' } );
					}
				}
				return;
			}
			if ( event.altKey ) {
				return;
			}

			switch ( event.key ) {
				case ' ':
					event.preventDefault();
					event.stopPropagation();
					onTogglePlay();
					break;
				case 'Delete':
				case 'Backspace':
					// The reducer floors removal at one chapter; readOnly drops edits.
					if ( ! readOnly && session.selectedId !== null ) {
						event.preventDefault();
						event.stopPropagation();
						dispatch( { type: 'REMOVE', id: session.selectedId } );
					}
					break;
			}
		},
		[ confirmation, dispatch, handleRequestClose, onTogglePlay, readOnly, session.selectedId ]
	);

	const videoTitle = title || __( 'VideoPress video', 'jetpack-videopress-pkg' );
	const modalHeaderTitle = sprintf(
		/* translators: %s: video title. */
		__( 'Manage chapters for %s', 'jetpack-videopress-pkg' ),
		videoTitle
	);

	return isOpen ? (
		<Modal
			title={ modalHeaderTitle }
			onRequestClose={ handleRequestClose }
			className="videopress-chapter-manager"
			/*
			 * The built-in dismiss button and outside-click both play the close
			 * animation before consulting `onRequestClose`, which flashes the
			 * modal away and back when the discard confirmation vetoes the
			 * close. Escape is intercepted in the content for the same reason.
			 */
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			headerActions={
				<Button
					size="small"
					icon={ close }
					label={ __( 'Close', 'jetpack-videopress-pkg' ) }
					onClick={ handleRequestClose }
				/>
			}
		>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Intercepts Escape before the Modal's animate-then-close handling and maps the editor shortcuts. */ }
			<div className="videopress-chapter-manager__body" onKeyDown={ handleBodyKeyDown }>
				<div className="videopress-chapter-manager__action-bar">
					<h3 className="videopress-chapter-manager__action-bar-title">
						{ __( 'Chapters', 'jetpack-videopress-pkg' ) }
					</h3>
					<div className="videopress-chapter-manager__action-buttons">
						<Button
							size="small"
							icon={ undoIcon }
							label={ __( 'Undo', 'jetpack-videopress-pkg' ) }
							disabled={ chaptersLocked || ! canUndo( history, chaptersEditsEqual ) }
							accessibleWhenDisabled
							onClick={ () => dispatch( { type: 'UNDO' } ) }
						/>
						<Button
							size="small"
							icon={ redoIcon }
							label={ __( 'Redo', 'jetpack-videopress-pkg' ) }
							disabled={ chaptersLocked || ! canRedo( history ) }
							accessibleWhenDisabled
							onClick={ () => dispatch( { type: 'REDO' } ) }
						/>
						<span className="videopress-chapter-manager__action-divider" aria-hidden="true" />
						<Button
							variant="secondary"
							onClick={ requestDiscard }
							disabled={ chaptersLocked || ! effectiveDirty }
						>
							{ __( 'Discard changes', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ () => void doSave() }
							isBusy={ metaSavePending }
							disabled={ chaptersLocked || ! effectiveDirty }
						>
							{ __( 'Save', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</div>

				<div
					className="videopress-chapter-manager__workspace vp-chapters-tokens"
					ref={ workspaceRef }
					/* Programmatic focus target only (see the guard above); stays out of the tab order. */
					tabIndex={ -1 }
				>
					{ itemState === 'loading' && (
						<p className="videopress-chapter-manager__status" role="status">
							{ __( 'Loading video information…', 'jetpack-videopress-pkg' ) }
						</p>
					) }
					{ itemState === 'unavailable' && (
						<p className="videopress-chapter-manager__status" role="status">
							{ __(
								'Chapters can’t be edited right now because the video’s information couldn’t be loaded. The video may still be processing.',
								'jetpack-videopress-pkg'
							) }
						</p>
					) }
					{ itemState === 'ready' && (
						<>
							{ /*
							 * The same minimal player as the dashboard's Editor tab:
							 * a bare <video> stage on the H.264 rendition derived
							 * from the on-open item fetch (private videos are signed
							 * with a playback JWT inside the player). It is the
							 * playhead source for the timeline below and stays
							 * mounted at every viewport width. The item's original
							 * upload URL is deliberately not offered as a fallback —
							 * without a ready rendition the player explains that the
							 * video has no playable source yet.
							 */ }
							<ChaptersPreviewPlayer
								ref={ playerRef }
								video={ {
									guid,
									isPrivate,
									durationSeconds: ( itemDurationMs ?? 0 ) / 1000,
									playbackUrl,
									sourceUrl: undefined,
								} }
								onTimeUpdate={ onTimeUpdate }
								onPlayingChange={ onPlayingChange }
							/>
							<div
								className={
									'videopress-chapter-manager__editor' +
									( chaptersLocked ? ' videopress-chapter-manager__editor--locked' : '' )
								}
								aria-busy={ chaptersLocked || undefined }
							>
								<ChaptersTimeline
									session={ session }
									dispatch={ dispatch }
									currentMs={ currentMs }
									onSeek={ onSeek }
									onTogglePlay={ onTogglePlay }
									playing={ playing }
									locked={ chaptersLocked }
									onScrubStart={ onScrubStart }
									onScrubEnd={ onScrubEnd }
									// The body's onKeyDown above maps the same keys instead.
									shortcutsEnabled={ false }
									readOnly={ readOnly }
								/>
							</div>
						</>
					) }
				</div>

				{ confirmation && (
					<ConfirmationOverlay
						message={ confirmation.message }
						confirmLabel={ confirmation.confirmLabel }
						onConfirm={ () => {
							const pending = confirmation;
							setConfirmation( null );
							pending.onConfirm();
						} }
						onCancel={ () => setConfirmation( null ) }
					/>
				) }

				<SnackbarList
					notices={ snackbars }
					className="videopress-chapter-manager__snackbars"
					onRemove={ removeSnackbar }
				/>
			</div>
		</Modal>
	) : null;
}
