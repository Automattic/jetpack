/**
 * The Studio editor timeline: a horizontally scrollable strip with an ordered
 * stack of tracks (time ruler + filmstrip), an edit-overlay layer spanning
 * all tracks (trim handles, shrouds, cut segments), and a 1px playhead line.
 *
 * Geometry: the full master duration maps onto `viewportWidth * zoom` pixels
 * of content inside an `overflow-x` scroller (zoom 1 = fit). Zooming — via
 * the toolbar slider or modifier+wheel — keeps the time under the playhead
 * stationary on screen by compensating `scrollLeft`; a plain vertical wheel
 * scrolls the strip. Pointer-down/drag on empty ruler/track area scrubs the
 * playhead (paused seeks are unconstrained on the master, by design — that's
 * how handles get placed outside the current trim window).
 *
 * The playhead renders as `transform: translateX(...)` straight from the
 * `currentMs` prop, which the parent feeds from the preview player's
 * rAF-driven state — no internal animation loop here. It is also a focusable
 * `role="slider"` with arrow-key nudging, and document-level shortcuts
 * (space, arrows, Home/End, Delete, mod+Z) attach while the timeline is
 * mounted.
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatTimecode, getPxPerMs, msToPx } from '../state/time-utils';
import StudioEditorEditOverlay from './edit-overlay';
import StudioEditorFilmstripTrack from './filmstrip-track';
import StudioEditorTimeRuler from './time-ruler';
import StudioEditorTimelineToolbar from './toolbar';
import { useElementWidth } from './use-element-width';
import { NUDGE_LARGE_MS, NUDGE_MS, useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { useTimelinePointerDrag } from './use-pointer-drag';
import { MAX_ZOOM } from './zoom-control';
import './style.scss';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { EditSession, EditSessionAction } from '../state/edit-session';
import type { HistoryAction } from '../state/history';
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react';

/**
 * Multiplier applied per wheel-delta unit while zooming with a modifier key.
 * `exp( -deltaY * factor )` gives smooth, symmetric zoom in both directions.
 */
const WHEEL_ZOOM_FACTOR = 0.002;

export type StudioEditorTimelineProps = {
	/** The edit session. */
	session: EditSession;
	/** Dispatch into the history-wrapped session reducer. */
	dispatch: ( action: HistoryAction< EditSessionAction > ) => void;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Seek the preview player to a master-timeline ms. */
	onSeek: ( ms: number ) => void;
	/** Toggle preview playback (space bar). */
	onTogglePlay: () => void;
	/**
	 * A scrub gesture started (pointer-down on empty track area). The parent
	 * pauses playback here so per-move seeks don't fight the playback
	 * resolver's own corrective seeks.
	 */
	onScrubStart?: () => void;
	/** The scrub gesture ended (pointer-up/cancel). */
	onScrubEnd?: () => void;
	/**
	 * False detaches the document-level keyboard shortcuts (e.g. while a
	 * confirm dialog is open, so Space activates the focused dialog button
	 * instead of toggling playback behind it). Defaults to true.
	 */
	shortcutsEnabled?: boolean;
	/** Filmstrip data for the strip track; absent renders the placeholder. */
	filmstrip?: FilmstripState;
};

/**
 * Clamp a time to the master duration.
 *
 * @param ms         - Candidate time in ms.
 * @param durationMs - Master duration in ms.
 * @return The clamped integer time.
 */
function clampToDuration( ms: number, durationMs: number ): number {
	return Math.min( durationMs, Math.max( 0, Math.round( ms ) ) );
}

/**
 * The timeline strip.
 *
 * @param props                  - Component props.
 * @param props.session          - The edit session.
 * @param props.dispatch         - Dispatch into the history-wrapped reducer.
 * @param props.currentMs        - Live playhead position in ms.
 * @param props.onSeek           - Seek the preview player.
 * @param props.onTogglePlay     - Toggle preview playback.
 * @param props.onScrubStart     - A scrub gesture started.
 * @param props.onScrubEnd       - The scrub gesture ended.
 * @param props.shortcutsEnabled - Whether the document-level shortcuts attach.
 * @param props.filmstrip        - Filmstrip data for the strip track.
 * @return The timeline element.
 */
export default function StudioEditorTimeline( {
	session,
	dispatch,
	currentMs,
	onSeek,
	onTogglePlay,
	onScrubStart,
	onScrubEnd,
	shortcutsEnabled = true,
	filmstrip,
}: StudioEditorTimelineProps ): ReactElement {
	const durationMs = session.durationMs;
	const [ zoom, setZoom ] = useState( 1 );
	const { ref: widthRef, width: viewportWidth } = useElementWidth();
	const [ scrollerEl, setScrollerEl ] = useState< HTMLDivElement | null >( null );
	const contentRef = useRef< HTMLDivElement | null >( null );

	// Refs mirroring live values, so the zoom math and the non-passive wheel
	// listener never work from stale closures.
	const currentMsRef = useRef( currentMs );
	currentMsRef.current = currentMs;
	const zoomRef = useRef( zoom );
	zoomRef.current = zoom;
	// scrollLeft to apply after the content re-renders at the new width.
	const pendingScrollRef = useRef< number | null >( null );

	const pxPerMs = getPxPerMs( viewportWidth, zoom, durationMs );
	const contentWidth = viewportWidth > 0 ? viewportWidth * zoom : 0;

	const scrollerRef = useCallback(
		( element: HTMLDivElement | null ) => {
			widthRef( element );
			setScrollerEl( element );
		},
		[ widthRef ]
	);

	// Change zoom while keeping the time under the playhead at the same
	// on-screen x: record the playhead's screen offset at the old scale and
	// solve for the scrollLeft that reproduces it at the new one.
	const applyZoom = useCallback(
		( requested: number ) => {
			const next = Math.min( MAX_ZOOM, Math.max( 1, requested ) );
			setZoom( previous => {
				if ( next === previous ) {
					return previous;
				}
				if ( scrollerEl && viewportWidth > 0 && durationMs > 0 ) {
					const oldPx = getPxPerMs( viewportWidth, previous, durationMs );
					const newPx = getPxPerMs( viewportWidth, next, durationMs );
					const screenX = msToPx( currentMsRef.current, oldPx ) - scrollerEl.scrollLeft;
					pendingScrollRef.current = msToPx( currentMsRef.current, newPx ) - screenX;
				}
				return next;
			} );
		},
		[ scrollerEl, viewportWidth, durationMs ]
	);
	const applyZoomRef = useRef( applyZoom );
	applyZoomRef.current = applyZoom;

	useLayoutEffect( () => {
		if ( pendingScrollRef.current === null || ! scrollerEl ) {
			return;
		}
		const max = Math.max( 0, scrollerEl.scrollWidth - scrollerEl.clientWidth );
		scrollerEl.scrollLeft = Math.min( max, Math.max( 0, pendingScrollRef.current ) );
		pendingScrollRef.current = null;
	}, [ zoom, scrollerEl ] );

	// Modifier+wheel zooms, plain vertical wheel scrolls the strip. Attached
	// manually because React wheel listeners are passive — preventDefault
	// (needed to suppress browser page-zoom and page-scroll) requires a
	// non-passive subscription.
	useEffect( () => {
		if ( ! scrollerEl ) {
			return;
		}
		const onWheel = ( event: WheelEvent ) => {
			if ( event.ctrlKey || event.metaKey ) {
				event.preventDefault();
				applyZoomRef.current( zoomRef.current * Math.exp( -event.deltaY * WHEEL_ZOOM_FACTOR ) );
			} else if ( event.deltaY !== 0 && event.deltaX === 0 ) {
				event.preventDefault();
				scrollerEl.scrollLeft += event.deltaY;
			}
		};
		scrollerEl.addEventListener( 'wheel', onWheel, { passive: false } );
		return () => scrollerEl.removeEventListener( 'wheel', onWheel );
	}, [ scrollerEl ] );

	const seekClamped = useCallback(
		( ms: number ) => onSeek( clampToDuration( ms, durationMs ) ),
		[ onSeek, durationMs ]
	);

	// Scrubbing: pointer-down/drag on empty ruler/track area moves the
	// playhead. Handles and cut segments stopPropagation their own
	// pointer-downs, so only genuinely empty areas reach this surface.
	const scrub = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		onDragStart: () => {
			onScrubStart?.();
			if ( session.selectedCutId !== null ) {
				dispatch( { type: 'SELECT_CUT', id: null } );
			}
		},
		onDragMove: seekClamped,
		onDragEnd: onScrubEnd,
	} );

	useKeyboardShortcuts( {
		enabled: shortcutsEnabled,
		onTogglePlay,
		onNudge: delta => seekClamped( currentMs + delta ),
		onHome: () => onSeek( session.trimStartMs ),
		onEnd: () => onSeek( session.trimEndMs ),
		onRemoveSelectedCut: () => {
			if ( session.selectedCutId !== null ) {
				dispatch( { type: 'REMOVE_CUT', id: session.selectedCutId } );
			}
		},
		onUndo: () => dispatch( { type: 'UNDO' } ),
		onRedo: () => dispatch( { type: 'REDO' } ),
	} );

	const onPlayheadKeyDown = ( event: ReactKeyboardEvent< HTMLElement > ) => {
		let delta: number;
		if ( event.key === 'ArrowLeft' ) {
			delta = event.shiftKey ? -NUDGE_LARGE_MS : -NUDGE_MS;
		} else if ( event.key === 'ArrowRight' ) {
			delta = event.shiftKey ? NUDGE_LARGE_MS : NUDGE_MS;
		} else {
			return;
		}
		// Handled here; keep the document-level shortcuts from double-nudging.
		event.preventDefault();
		event.stopPropagation();
		seekClamped( currentMs + delta );
	};

	// Ordered track stack.
	const tracks: { id: string; element: ReactElement }[] = [
		{
			id: 'ruler',
			element: <StudioEditorTimeRuler durationMs={ durationMs } pxPerMs={ pxPerMs } />,
		},
		{
			id: 'filmstrip',
			element: <StudioEditorFilmstripTrack filmstrip={ filmstrip } />,
		},
	];

	const playheadMs = clampToDuration( currentMs, durationMs );

	return (
		<div className="vp-studio-timeline" data-testid="studio-timeline">
			<StudioEditorTimelineToolbar
				currentMs={ currentMs }
				canAddCut={ currentMs >= session.trimStartMs && currentMs <= session.trimEndMs }
				onAddCut={ () => dispatch( { type: 'ADD_CUT', atMs: currentMs } ) }
				onSeek={ seekClamped }
				zoom={ zoom }
				onZoomChange={ applyZoom }
				onFit={ () => applyZoom( 1 ) }
			/>
			<div
				className="vp-studio-timeline__scroller"
				data-testid="studio-timeline-scroller"
				ref={ scrollerRef }
			>
				<div
					className="vp-studio-timeline__content"
					data-testid="studio-timeline-content"
					ref={ contentRef }
					style={ contentWidth > 0 ? { width: `${ contentWidth }px` } : undefined }
					onPointerDown={ scrub.onPointerDown }
					onPointerMove={ scrub.onPointerMove }
					onPointerUp={ scrub.onPointerUp }
					onPointerCancel={ scrub.onPointerCancel }
				>
					{ tracks.map( track => (
						<div
							key={ track.id }
							className={ `vp-studio-timeline__track vp-studio-timeline__track--${ track.id }` }
							data-testid={ `studio-timeline-track-${ track.id }` }
						>
							{ track.element }
						</div>
					) ) }
					<StudioEditorEditOverlay
						session={ session }
						currentMs={ currentMs }
						pxPerMs={ pxPerMs }
						contentRef={ contentRef }
						dispatch={ dispatch }
						onSeek={ seekClamped }
					/>
					<div
						className="vp-studio-timeline__playhead"
						data-testid="studio-timeline-playhead"
						role="slider"
						tabIndex={ 0 }
						aria-label={ __( 'Playhead', 'jetpack-videopress-pkg' ) }
						aria-orientation="horizontal"
						aria-valuemin={ 0 }
						aria-valuemax={ durationMs }
						aria-valuenow={ playheadMs }
						aria-valuetext={ formatTimecode( playheadMs ) }
						style={ { transform: `translateX(${ msToPx( playheadMs, pxPerMs ) }px)` } }
						onKeyDown={ onPlayheadKeyDown }
					/>
				</div>
			</div>
		</div>
	);
}
