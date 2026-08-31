/**
 * The timeline shell: the tool-agnostic strip chrome the chapters editor's
 * timeline composes with its tracks.
 *
 * It renders the toolbar slot, the horizontal scroller (with the
 * `contain: inline-size` guard — removing it recreates the zoom feedback
 * loop where the zoomed strip inflates ancestors and feeds the wider
 * viewport back into the zoom math), the scaled content element that doubles
 * as the scrub surface, the render-prop track rows and overlay, and the
 * playhead. Geometry (zoom, pxPerMs, contentWidth) comes from
 * {@link useTimelineGeometry} and is exposed to the render props via a
 * context object, along with the content element ref the drag hooks measure
 * against.
 *
 * One-scale invariant: the shell pins the content element AND every track
 * row to the same explicit `contentWidth` (`scaledWidthStyle`). The tracks
 * must not size themselves from their parent box: the content element can
 * legitimately render wider than `contentWidth` (its `min-width: 100%`
 * fallback, an ancestor stretching it while the measured viewport is stale
 * between a layout change and the ResizeObserver's next delivery), and a
 * track that fills that box would put its contents on a different horizontal
 * scale than the ruler ticks, playhead, and overlay, which all derive from
 * `pxPerMs`. Pinning the rows here makes that divergence structurally
 * impossible: worst case everything is off together and self-heals on the
 * next measurement. `undefined` while unmeasured keeps the initial
 * placeholder render fluid.
 *
 * The playhead renders as `transform: translateX(...)` straight from the
 * `currentMs` prop, which the parent feeds from the preview player's
 * rAF-driven state — no internal animation loop here. It is also a focusable
 * `role="slider"` with arrow-key nudging. Pointer-down/drag on empty
 * ruler/track area scrubs the playhead (paused seeks are unconstrained on
 * the master, by design). While `playing` is true the shell auto-follows: it
 * chases `scrollLeft` to keep the playhead inside the follow window,
 * suppressed during any pointer gesture on the strip so a drag never fights
 * the chase.
 *
 * The shell also draws the pointer-transparent gridline layer: one 1px
 * full-height vertical per ruler tick, positioned from the same
 * {@link useRulerTicks}/`pxPerMs` pair as the ruler labels so lines and
 * labels cannot drift apart.
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef } from 'react';
import { formatTimecode, msToPx } from '../state/time-utils';
import { NUDGE_LARGE_MS, NUDGE_MS } from './use-keyboard-shortcuts';
import { useTimelinePointerDrag } from './use-pointer-drag';
import { useRulerTicks } from './use-ruler-ticks';
import { useTimelineGeometry } from './use-timeline-geometry';
import './style.scss';
import type { ZoomLadder } from './zoom-ladder';
import type {
	KeyboardEvent as ReactKeyboardEvent,
	ReactElement,
	ReactNode,
	RefObject,
} from 'react';

/**
 * Auto-follow margins: while playing, the playhead is kept at least this far
 * from the scroller's left/right edges by chasing `scrollLeft`.
 */
const FOLLOW_MARGIN_LEFT_PX = 40;
const FOLLOW_MARGIN_RIGHT_PX = 80;

/**
 * Clamp a time to the master duration.
 *
 * @param ms         - Candidate time in ms.
 * @param durationMs - Master duration in ms.
 * @return The clamped integer time.
 */
export function clampToDuration( ms: number, durationMs: number ): number {
	return Math.min( durationMs, Math.max( 0, Math.round( ms ) ) );
}

/**
 * One track row in the shell's ordered stack.
 */
export interface TimelineShellTrack {
	/** Stable row id; becomes the row class/testid suffix. */
	id: string;
	/** The track's content element. */
	element: ReactElement;
}

/**
 * Geometry and refs the shell exposes to its render props.
 */
export interface TimelineShellContext {
	/** Scale from `getPxPerMs` at the effective zoom. */
	pxPerMs: number;
	/** Scaled content width in px; 0 while the viewport is unmeasured. */
	contentWidth: number;
	/** Measured scroller width in px. */
	viewportWidth: number;
	/** Effective (cap-clamped) zoom factor; 1 = fit. */
	zoom: number;
	/** Current zoom ceiling (the ladder's ladderMaxZoom). */
	zoomMax: number;
	/** Current zoom ladder (the slider's stop descriptor). */
	zoomLadder: ZoomLadder;
	/** Request a zoom change (clamped; playhead-anchored scroll follows). */
	applyZoom: ( requested: number ) => void;
	/** The scaled content element, for pointer→ms math in drag hooks. */
	contentRef: RefObject< HTMLDivElement | null >;
	/**
	 * The horizontal scroller element, or null before mount — tracks that
	 * lazy-load by scroll position read scrollLeft/clientWidth from it and
	 * subscribe to its scroll events.
	 */
	scrollerEl: HTMLDivElement | null;
}

type Props = {
	/** Master duration in ms. */
	durationMs: number;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/**
	 * Whether preview playback is running. While true the shell auto-follows
	 * the playhead by chasing `scrollLeft`.
	 */
	playing?: boolean;
	/**
	 * True while a processing job locks editing. Only the scroller region
	 * blocks pointer interaction (the toolbar stays usable); the parent's
	 * guarded dispatch drops edit dispatches either way, and it also owns
	 * the aria-busy announcement.
	 */
	locked?: boolean;
	/** The zoom ladder for a given viewport width. Called during render. */
	getZoomLadder: ( viewportWidth: number ) => ZoomLadder;
	/** Seek the preview player (clamped to the duration by the shell). */
	onSeek: ( ms: number ) => void;
	/** A scrub gesture started (pointer-down on empty track area). */
	onScrubStart?: () => void;
	/** The scrub gesture ended (pointer-up/cancel). */
	onScrubEnd?: () => void;
	/** Toolbar row above the scroller. */
	toolbar: ( context: TimelineShellContext ) => ReactNode;
	/** Ordered track rows; the shell pins each to the content width. */
	tracks: ( context: TimelineShellContext ) => TimelineShellTrack[];
	/** Overlay sheet rendered above the tracks, below the playhead. */
	overlay?: ( context: TimelineShellContext ) => ReactNode;
};

/**
 * The shared timeline strip chrome.
 *
 * @param props               - Component props.
 * @param props.durationMs    - Master duration in ms.
 * @param props.currentMs     - Live playhead position in ms.
 * @param props.playing       - Whether preview playback is running.
 * @param props.locked        - Whether a processing job locks the strip.
 * @param props.getZoomLadder - The zoom ladder for a given viewport width.
 * @param props.onSeek        - Seek the preview player.
 * @param props.onScrubStart  - A scrub gesture started.
 * @param props.onScrubEnd    - The scrub gesture ended.
 * @param props.toolbar       - Toolbar row above the scroller.
 * @param props.tracks        - Ordered track rows.
 * @param props.overlay       - Overlay sheet above the tracks.
 * @return The timeline shell element.
 */
export default function TimelineShell( {
	durationMs,
	currentMs,
	playing = false,
	locked = false,
	getZoomLadder,
	onSeek,
	onScrubStart,
	onScrubEnd,
	toolbar,
	tracks,
	overlay,
}: Props ): ReactElement {
	const contentRef = useRef< HTMLDivElement | null >( null );
	const geometry = useTimelineGeometry( { durationMs, currentMs, getZoomLadder } );
	const {
		pxPerMs,
		contentWidth,
		viewportWidth,
		zoom,
		zoomMax,
		zoomLadder,
		applyZoom,
		scaledWidthStyle,
	} = geometry;
	const ticks = useRulerTicks( durationMs, pxPerMs );

	// True between any pointer-down and pointer-up/cancel on the strip. Set
	// in the capture phase so it also covers overlay children (chapter
	// markers) that stopPropagation their bubbling pointer-downs; with
	// pointer capture their up/cancel events still retarget through this
	// ancestor's capture phase, so the flag always clears. A plain ref, not
	// state: the auto-follow effect only reads it when `currentMs` next
	// changes, and re-rendering mid-gesture would buy nothing.
	const gestureRef = useRef( false );

	const seekClamped = useCallback(
		( ms: number ) => onSeek( clampToDuration( ms, durationMs ) ),
		[ onSeek, durationMs ]
	);

	// Scrubbing: pointer-down/drag on empty ruler/track area moves the
	// playhead. Markers stopPropagation their own pointer-downs, so only
	// genuinely empty areas reach this surface.
	const scrub = useTimelinePointerDrag( {
		contentRef,
		pxPerMs,
		onDragStart: onScrubStart,
		onDragMove: seekClamped,
		onDragEnd: onScrubEnd,
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

	const context: TimelineShellContext = {
		pxPerMs,
		contentWidth,
		viewportWidth,
		zoom,
		zoomMax,
		zoomLadder,
		applyZoom,
		contentRef,
		scrollerEl: geometry.scrollerEl,
	};

	const playheadMs = clampToDuration( currentMs, durationMs );
	const playheadPx = msToPx( playheadMs, pxPerMs );

	// Auto-follow: while playing, chase scrollLeft minimally so the playhead
	// stays inside [scrollLeft + left margin, scrollLeft + clientWidth −
	// right margin]. Suppressed during any drag gesture on the strip — the
	// user's pointer→ms math must not have the ground scrolled out from
	// under it mid-drag. Driven by the `currentMs`-derived playheadPx, which
	// the parent updates from the player's rAF state, so the chase advances
	// with playback at no extra animation loop.
	const { scrollerEl } = geometry;
	useEffect( () => {
		if ( ! playing || gestureRef.current || ! scrollerEl ) {
			return;
		}
		const clientWidth = scrollerEl.clientWidth;
		if ( clientWidth <= 0 ) {
			return;
		}
		let next: number | null = null;
		if ( playheadPx < scrollerEl.scrollLeft + FOLLOW_MARGIN_LEFT_PX ) {
			next = playheadPx - FOLLOW_MARGIN_LEFT_PX;
		} else if ( playheadPx > scrollerEl.scrollLeft + clientWidth - FOLLOW_MARGIN_RIGHT_PX ) {
			next = playheadPx - ( clientWidth - FOLLOW_MARGIN_RIGHT_PX );
		}
		if ( next !== null ) {
			const maxScroll = Math.max( 0, scrollerEl.scrollWidth - clientWidth );
			scrollerEl.scrollLeft = Math.min( maxScroll, Math.max( 0, next ) );
		}
	}, [ playing, playheadPx, scrollerEl ] );

	return (
		<div className="vp-chapters-timeline" data-testid="chapters-timeline">
			{ toolbar( context ) }
			<div
				className={
					'vp-chapters-timeline__scroller' +
					( locked ? ' vp-chapters-timeline__scroller--locked' : '' )
				}
				data-testid="chapters-timeline-scroller"
				ref={ geometry.scrollerRef }
			>
				<div
					className="vp-chapters-timeline__content"
					data-testid="chapters-timeline-content"
					ref={ contentRef }
					style={ scaledWidthStyle }
					onPointerDownCapture={ event => {
						// Primary button only: every drag gesture on the strip starts
						// with button 0 (the drag hooks ignore the rest), and e.g. a
						// right-click's pointerup can be swallowed by the context
						// menu — the flag would stick and permanently suppress
						// auto-follow.
						if ( event.button === 0 ) {
							gestureRef.current = true;
						}
					} }
					onPointerUpCapture={ () => {
						gestureRef.current = false;
					} }
					onPointerCancelCapture={ () => {
						gestureRef.current = false;
					} }
					onPointerDown={ scrub.onPointerDown }
					onPointerMove={ scrub.onPointerMove }
					onPointerUp={ scrub.onPointerUp }
					onPointerCancel={ scrub.onPointerCancel }
				>
					{ tracks( context ).map( track => (
						<div
							key={ track.id }
							className={ `vp-chapters-timeline__track vp-chapters-timeline__track--${ track.id }` }
							data-testid={ `chapters-timeline-track-${ track.id }` }
							style={ scaledWidthStyle }
						>
							{ track.element }
						</div>
					) ) }
					<div
						className="vp-chapters-timeline__gridlines"
						data-testid="chapters-timeline-gridlines"
						aria-hidden="true"
					>
						{ ticks.map( ms => (
							<div
								key={ ms }
								className="vp-chapters-timeline__gridline"
								data-testid="chapters-timeline-gridline"
								style={ { transform: `translateX(${ msToPx( ms, pxPerMs ) }px)` } }
							/>
						) ) }
					</div>
					{ overlay?.( context ) }
					<div
						className="vp-chapters-timeline__playhead"
						data-testid="chapters-timeline-playhead"
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
