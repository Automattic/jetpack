/**
 * Shared pointer-drag plumbing for timeline gestures (scrub, trim handles,
 * cut edges).
 *
 * A drag starts on pointerdown with `setPointerCapture`, so the subsequent
 * pointermove/pointerup events keep firing on the same element even when the
 * pointer leaves it. Every event is translated into an integer master-timeline
 * ms by measuring against the timeline's scaled content element, and the
 * grabbed thing's original position is preserved as an offset so a handle
 * doesn't jump to the pointer on grab (a 10px jump is hundreds of ms at fit
 * zoom).
 *
 * Callers decide what the positions mean: scrubbing seeks on every move; edit
 * handles dispatch TRANSIENT session actions on move and COMMIT on release.
 */
import { useCallback, useRef } from 'react';
import { pxToMs } from '../state/time-utils';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

/**
 * Options for {@link useTimelinePointerDrag}.
 */
export interface TimelinePointerDragOptions {
	/** The timeline's scaled content element, measured on every event. */
	contentRef: RefObject< HTMLElement | null >;
	/** Scale from `getPxPerMs`; drags are ignored when 0. */
	pxPerMs: number;
	/**
	 * Position of the grabbed thing at drag start, in ms. When provided, moves
	 * are reported relative to it (grab-offset preserved); when omitted, moves
	 * report the pointer's own position (scrubbing).
	 */
	getAnchorMs?: () => number;
	/** Called with the drag position on pointerdown and every pointermove. */
	onDragMove: ( ms: number ) => void;
	/** Called once when the drag starts, before the first onDragMove. */
	onDragStart?: () => void;
	/** Called once when the drag ends (pointerup or pointercancel). */
	onDragEnd?: () => void;
}

/**
 * Pointer-event props returned by {@link useTimelinePointerDrag}; spread them
 * onto the draggable element.
 */
export interface TimelinePointerDragHandlers {
	onPointerDown: ( event: ReactPointerEvent< HTMLElement > ) => void;
	onPointerMove: ( event: ReactPointerEvent< HTMLElement > ) => void;
	onPointerUp: ( event: ReactPointerEvent< HTMLElement > ) => void;
	onPointerCancel: ( event: ReactPointerEvent< HTMLElement > ) => void;
}

/**
 * Convert a pointer event's clientX into master-timeline ms.
 *
 * @param clientX - The pointer's viewport x.
 * @param content - The timeline's scaled content element.
 * @param pxPerMs - Scale from `getPxPerMs`.
 * @return The position in integer ms (unclamped).
 */
function pointerMs( clientX: number, content: HTMLElement, pxPerMs: number ): number {
	return pxToMs( clientX - content.getBoundingClientRect().left, pxPerMs );
}

/**
 * Wire a pointer-captured drag that reports positions in master-timeline ms.
 *
 * @param options - Content element, scale, and drag callbacks.
 * @return Pointer-event props to spread onto the draggable element.
 */
export function useTimelinePointerDrag(
	options: TimelinePointerDragOptions
): TimelinePointerDragHandlers {
	const optionsRef = useRef( options );
	optionsRef.current = options;

	// null when idle; the grab offset (anchor - pointer) while dragging.
	const offsetRef = useRef< number | null >( null );

	const onPointerDown = useCallback( ( event: ReactPointerEvent< HTMLElement > ) => {
		const { contentRef, pxPerMs, getAnchorMs, onDragMove, onDragStart } = optionsRef.current;
		const content = contentRef.current;
		if ( event.button !== 0 || ! content || pxPerMs <= 0 ) {
			return;
		}
		event.currentTarget.setPointerCapture( event.pointerId );
		const ms = pointerMs( event.clientX, content, pxPerMs );
		offsetRef.current = getAnchorMs ? getAnchorMs() - ms : 0;
		onDragStart?.();
		onDragMove( ms + offsetRef.current );
	}, [] );

	const onPointerMove = useCallback( ( event: ReactPointerEvent< HTMLElement > ) => {
		const { contentRef, pxPerMs, onDragMove } = optionsRef.current;
		const content = contentRef.current;
		if ( offsetRef.current === null || ! content || pxPerMs <= 0 ) {
			return;
		}
		onDragMove( pointerMs( event.clientX, content, pxPerMs ) + offsetRef.current );
	}, [] );

	const endDrag = useCallback( ( event: ReactPointerEvent< HTMLElement > ) => {
		if ( offsetRef.current === null ) {
			return;
		}
		offsetRef.current = null;
		// Capture auto-releases on pointerup/cancel; be explicit for safety.
		if ( event.currentTarget.hasPointerCapture?.( event.pointerId ) ) {
			event.currentTarget.releasePointerCapture( event.pointerId );
		}
		optionsRef.current.onDragEnd?.();
	}, [] );

	return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag };
}
