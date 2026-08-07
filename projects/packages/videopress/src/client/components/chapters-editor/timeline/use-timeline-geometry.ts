/**
 * Timeline geometry for the chapters editor: zoom state, viewport
 * measurement, and the single horizontal scale every strip element derives
 * from.
 *
 * The strip renders the full master duration across `viewportWidth * zoom`
 * pixels of content inside an `overflow-x` scroller (zoom 1 = fit). That one
 * product — `contentWidth`, and the `pxPerMs` derived with it — is the only
 * horizontal scale: the content strip, the track rows, the playhead
 * transform, and the overlay all take their width or positions from it, so
 * no track can render on a different scale than the times above it.
 *
 * Zoom is capped by the caller-provided ladder's ceiling; the ladder is
 * re-derived — and the effective zoom re-clamped — every render, so it
 * self-heals when the strip resolves asynchronously or the viewport
 * resizes. Zoom state stays a continuous number: the toolbar slider is a
 * discrete view of the ladder's stops, while modifier+wheel moves it
 * continuously. Both paths keep the time under the playhead stationary on
 * screen by compensating `scrollLeft`; a plain vertical wheel scrolls the
 * strip. The wheel listener is attached manually because React wheel
 * listeners are passive and preventDefault (needed to suppress browser
 * page-zoom/page-scroll) requires a non-passive subscription.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPxPerMs, msToPx } from '../state/time-utils';
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
	 * The zoom ladder for the current viewport width (e.g. the
	 * duration-scaled ladder via getFilmstripZoomLadder). Called during
	 * render; the ceiling is its ladderMaxZoom.
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
	 * Explicit width style pinning a box to `contentWidth`. The content
	 * element AND every track row must carry it, so no row can size itself
	 * from its parent box onto a different horizontal scale. `undefined`
	 * while unmeasured keeps the initial placeholder render fluid.
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

	// The caller's ladder ceiling is the zoom cap. Derived (not stored) and
	// clamped at derivation, so a `zoom` state that overshoots — the ladder
	// resolving mid-session, the viewport growing — heals on the next render
	// with no state-sync effect.
	const zoomLadder = getZoomLadder( viewportWidth );
	const zoomMax = ladderMaxZoom( zoomLadder );
	const effectiveZoom = Math.min( zoom, zoomMax );

	// Refs mirroring live values, so the zoom math and the non-passive wheel
	// listener never work from stale closures.
	const currentMsRef = useRef( currentMs );
	currentMsRef.current = currentMs;
	const zoomRef = useRef( effectiveZoom );
	zoomRef.current = effectiveZoom;
	// scrollLeft to apply after the content re-renders at the new width.
	const pendingScrollRef = useRef< number | null >( null );

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

	// Change zoom while keeping the time under the playhead at the same
	// on-screen x: record the playhead's screen offset at the old scale and
	// solve for the scrollLeft that reproduces it at the new one.
	const applyZoom = useCallback(
		( requested: number ) => {
			const next = Math.min( zoomMax, Math.max( 1, requested ) );
			setZoom( previous => {
				if ( next === previous ) {
					return previous;
				}
				if ( scrollerEl && viewportWidth > 0 && durationMs > 0 ) {
					// The playhead anchor must be measured at the zoom actually
					// on screen, which is the cap whenever `previous` overshoots
					// it (the render clamps the same way).
					const oldPx = getPxPerMs( viewportWidth, Math.min( previous, zoomMax ), durationMs );
					const newPx = getPxPerMs( viewportWidth, next, durationMs );
					const screenX = msToPx( currentMsRef.current, oldPx ) - scrollerEl.scrollLeft;
					pendingScrollRef.current = msToPx( currentMsRef.current, newPx ) - screenX;
				}
				return next;
			} );
		},
		[ scrollerEl, viewportWidth, durationMs, zoomMax ]
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
