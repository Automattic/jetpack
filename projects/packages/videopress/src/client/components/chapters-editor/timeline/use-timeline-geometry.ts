import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPxPerMs } from '../state/time-utils';
import { useElementWidth } from './use-element-width';
import { ladderMaxZoom } from './zoom-ladder';
import type { ZoomLadder } from './zoom-ladder';
import type { CSSProperties } from 'react';

/**
 * Multiplier applied per wheel-delta unit while zooming with a modifier key.
 * `exp( -deltaY * factor )` gives smooth, symmetric zoom in both directions.
 */
const WHEEL_ZOOM_FACTOR = 0.002;

/**
 * Options for {@link useTimelineGeometry}.
 */
export interface TimelineGeometryOptions {
	/** Master duration in ms. */
	durationMs: number;
	/** Live playhead position in ms — the anchor for zoom compensation. */
	currentMs: number;
	/**
	 * Derive the zoom stops and ceiling for the measured viewport width.
	 */
	getZoomLadder: ( viewportWidth: number ) => ZoomLadder;
}

/**
 * Value returned by {@link useTimelineGeometry}.
 */
export interface TimelineGeometry {
	/** Effective (cap-clamped) zoom factor; 1 = fit. */
	zoom: number;
	/** Current zoom ceiling (the ladder's ladderMaxZoom). */
	zoomMax: number;
	/** Current zoom ladder (the slider's stop descriptor). */
	zoomLadder: ZoomLadder;
	/** Measured scroller width in px; 0 until it reports one. */
	viewportWidth: number;
	/** Scale from `getPxPerMs` at the effective zoom. */
	pxPerMs: number;
	/** Scaled content width in px (`viewportWidth * zoom`); 0 unmeasured. */
	contentWidth: number;
	/**
	 * Pin the content and every track to the same measured width.
	 * Undefined until measured, allowing a fluid initial placeholder.
	 */
	scaledWidthStyle?: CSSProperties;
	/** Request a zoom change (clamped; playhead-anchored scroll follows). */
	applyZoom: ( requested: number ) => void;
	/** Callback ref to attach to the scroller element. */
	scrollerRef: ( element: HTMLDivElement | null ) => void;
	/** The attached scroller element, or null before mount. */
	scrollerEl: HTMLDivElement | null;
}

/**
 * Anchor zoom at the visible playhead, or the viewport center when it is offscreen.
 *
 * @param currentMs     - Playhead time.
 * @param pxPerMs       - Current timeline scale.
 * @param viewportWidth - Scroller width.
 * @param scrollLeft    - Current scroll position.
 * @return The time and screen position to preserve.
 */
function zoomAnchor(
	currentMs: number,
	pxPerMs: number,
	viewportWidth: number,
	scrollLeft: number
) {
	const playheadX = currentMs * pxPerMs - scrollLeft;
	const screenX = playheadX >= 0 && playheadX <= viewportWidth ? playheadX : viewportWidth / 2;
	return { timeMs: ( scrollLeft + screenX ) / pxPerMs, screenX };
}

/**
 * Own the timeline's zoom/scale state and the scroller wiring.
 *
 * @param options - Duration, playhead anchor, and the zoom ladder.
 * @return The derived geometry plus the zoom and scroller controls.
 */
export function useTimelineGeometry( options: TimelineGeometryOptions ): TimelineGeometry {
	const { durationMs, currentMs, getZoomLadder } = options;
	const [ zoom, setZoom ] = useState( 1 );
	const { ref: widthRef, width: viewportWidth } = useElementWidth();
	const [ scrollerEl, setScrollerEl ] = useState< HTMLDivElement | null >( null );

	const zoomLadder = getZoomLadder( viewportWidth );
	const zoomMax = ladderMaxZoom( zoomLadder );
	const effectiveZoom = Math.min( zoom, zoomMax );
	const currentMsRef = useRef( currentMs );
	currentMsRef.current = currentMs;
	const zoomRef = useRef( effectiveZoom );
	zoomRef.current = effectiveZoom;
	const pendingAnchorRef = useRef< { timeMs: number; screenX: number } | null >( null );
	const previousGeometry = useRef( { pxPerMs: 0, viewportWidth: 0 } );

	const pxPerMs = getPxPerMs( viewportWidth, effectiveZoom, durationMs );
	const contentWidth = viewportWidth > 0 ? viewportWidth * effectiveZoom : 0;
	const scaledWidthStyle = contentWidth > 0 ? { width: `${ contentWidth }px` } : undefined;

	const scrollerRef = useCallback(
		( element: HTMLDivElement | null ) => {
			widthRef( element );
			setScrollerEl( element );
		},
		[ widthRef ]
	);

	const applyZoom = useCallback(
		( requested: number ) => {
			const next = Math.min( zoomMax, Math.max( 1, requested ) );
			if ( ! Number.isFinite( next ) || next === zoomRef.current ) {
				return;
			}
			if ( scrollerEl && pxPerMs > 0 && ! pendingAnchorRef.current ) {
				pendingAnchorRef.current = zoomAnchor(
					currentMsRef.current,
					pxPerMs,
					viewportWidth,
					scrollerEl.scrollLeft
				);
			}
			// Wheel events can arrive together before React commits their new scale.
			zoomRef.current = next;
			setZoom( next );
		},
		[ scrollerEl, pxPerMs, viewportWidth, zoomMax ]
	);
	const applyZoomRef = useRef( applyZoom );
	applyZoomRef.current = applyZoom;

	useLayoutEffect( () => {
		const previous = previousGeometry.current;
		if ( scrollerEl && pxPerMs > 0 && previous.pxPerMs > 0 ) {
			const anchor =
				pendingAnchorRef.current ??
				zoomAnchor(
					currentMsRef.current,
					previous.pxPerMs,
					previous.viewportWidth,
					scrollerEl.scrollLeft
				);
			const max = Math.max( 0, contentWidth - viewportWidth );
			scrollerEl.scrollLeft = Math.min(
				max,
				Math.max( 0, anchor.timeMs * pxPerMs - anchor.screenX )
			);
		}
		pendingAnchorRef.current = null;
		previousGeometry.current = { pxPerMs, viewportWidth };
		// Persist a reduced ceiling so narrowing the viewport cannot resurrect an old zoom.
		if ( zoom > zoomMax ) {
			setZoom( zoomMax );
		}
	}, [ contentWidth, pxPerMs, viewportWidth, scrollerEl, zoom, zoomMax ] );

	// Modifier+wheel zooms, plain vertical wheel scrolls the strip.
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

	return {
		zoom: effectiveZoom,
		zoomMax,
		zoomLadder,
		viewportWidth,
		pxPerMs,
		contentWidth,
		scaledWidthStyle,
		applyZoom,
		scrollerRef,
		scrollerEl,
	};
}
