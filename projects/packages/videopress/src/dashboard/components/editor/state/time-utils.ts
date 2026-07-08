/**
 * Timeline math for the Studio editor: pixel↔millisecond mapping, trim
 * clamping, edge snapping, timecode formatting, and adaptive ruler steps.
 *
 * The timeline renders the full master duration across
 * `viewportWidth * zoom` pixels, so `pxPerMs = viewportWidth * zoom /
 * durationMs`. All millisecond values are integers on the original master
 * timeline.
 */
import type { EditSession } from './edit-session';

/**
 * Default snap threshold, in screen pixels.
 */
export const DEFAULT_SNAP_THRESHOLD_PX = 8;

/**
 * Minimum on-screen spacing between ruler ticks, in pixels.
 */
export const MIN_TICK_SPACING_PX = 80;

/**
 * Candidate ruler steps, 100ms up to 10 minutes.
 */
export const RULER_STEPS_MS = [
	100, 200, 500, 1000, 2000, 5000, 10000, 15000, 30000, 60000, 120000, 300000, 600000,
];

/**
 * Pixels per millisecond for the current viewport and zoom.
 *
 * @param viewportWidthPx - Visible timeline width in pixels.
 * @param zoom            - Zoom factor (1 = duration fits the viewport).
 * @param durationMs      - Master duration in ms.
 * @return Pixels per millisecond, or 0 for a degenerate duration.
 */
export function getPxPerMs( viewportWidthPx: number, zoom: number, durationMs: number ): number {
	if ( durationMs <= 0 ) {
		return 0;
	}
	return ( viewportWidthPx * zoom ) / durationMs;
}

/**
 * Convert a master-timeline time to a pixel offset.
 *
 * @param ms      - Time in ms.
 * @param pxPerMs - Scale from {@link getPxPerMs}.
 * @return Pixel offset from the timeline origin.
 */
export function msToPx( ms: number, pxPerMs: number ): number {
	return ms * pxPerMs;
}

/**
 * Convert a pixel offset to an integer master-timeline time.
 *
 * @param px      - Pixel offset from the timeline origin.
 * @param pxPerMs - Scale from {@link getPxPerMs}.
 * @return Time in integer ms, or 0 for a degenerate scale.
 */
export function pxToMs( px: number, pxPerMs: number ): number {
	if ( pxPerMs <= 0 ) {
		return 0;
	}
	return Math.round( px / pxPerMs );
}

/**
 * Clamp a time into the session's trim window.
 *
 * @param ms      - Time in ms.
 * @param session - Session (only the trim window is read).
 * @return The clamped integer time.
 */
export function clampToTrim(
	ms: number,
	session: Pick< EditSession, 'trimStartMs' | 'trimEndMs' >
): number {
	return Math.min( session.trimEndMs, Math.max( session.trimStartMs, Math.round( ms ) ) );
}

/**
 * Snap targets and scale for {@link snapMs}.
 */
export interface SnapContext {
	/** Scale from {@link getPxPerMs}; snapping is disabled when 0. */
	pxPerMs: number;
	/** Master duration in ms (its 0 and end are always snap targets). */
	durationMs: number;
	/** Playhead position to snap to, if any. */
	playheadMs?: number;
	/** Segment edges (trim handles, cut edges) to snap to. */
	edgesMs?: number[];
	/** On-screen snap radius in px. Default {@link DEFAULT_SNAP_THRESHOLD_PX}. */
	thresholdPx?: number;
}

/**
 * The full target list of a snap context: 0 and the duration always, plus
 * the playhead and any segment edges provided.
 *
 * @param context - Snap targets and scale.
 * @return The snap targets in ms.
 */
function snapTargets( context: SnapContext ): number[] {
	const { durationMs, playheadMs, edgesMs = [] } = context;
	return [ 0, durationMs, ...( playheadMs !== undefined ? [ playheadMs ] : [] ), ...edgesMs ];
}

/**
 * Snap a time to the nearest target — 0, the duration, the playhead, or a
 * segment edge — when it lies within the pixel threshold on screen. Returns
 * the (rounded) input unchanged when nothing is close enough.
 *
 * @param ms      - Candidate time in ms.
 * @param context - Snap targets and scale.
 * @return The snapped integer time.
 */
export function snapMs( ms: number, context: SnapContext ): number {
	const rounded = Math.round( ms );
	const { pxPerMs, thresholdPx } = context;
	if ( pxPerMs <= 0 ) {
		return rounded;
	}
	const thresholdMs = ( thresholdPx ?? DEFAULT_SNAP_THRESHOLD_PX ) / pxPerMs;

	let best: number | null = null;
	let bestDistance = Infinity;
	for ( const target of snapTargets( context ) ) {
		const distance = Math.abs( rounded - target );
		if ( distance <= thresholdMs && distance < bestDistance ) {
			best = target;
			bestDistance = distance;
		}
	}
	return best === null ? rounded : Math.round( best );
}

/**
 * Snap a width-preserving range move: each target is evaluated against BOTH
 * candidate edges — landing the range's start on it, or landing its end on
 * it (start = target − width) — and the smallest on-screen adjustment wins.
 * Returns the (rounded) requested start unchanged when neither edge comes
 * within the threshold of any target.
 *
 * @param startMs - Requested start of the moving range, in ms.
 * @param widthMs - Width of the moving range, in ms (preserved by the move).
 * @param context - Snap targets and scale (same shape as {@link snapMs}).
 * @return The snapped integer start.
 */
export function snapMoveMs( startMs: number, widthMs: number, context: SnapContext ): number {
	const rounded = Math.round( startMs );
	const { pxPerMs, thresholdPx } = context;
	if ( pxPerMs <= 0 ) {
		return rounded;
	}
	const thresholdMs = ( thresholdPx ?? DEFAULT_SNAP_THRESHOLD_PX ) / pxPerMs;

	let best: number | null = null;
	let bestDistance = Infinity;
	for ( const target of snapTargets( context ) ) {
		for ( const candidate of [ target, target - widthMs ] ) {
			const distance = Math.abs( rounded - candidate );
			if ( distance <= thresholdMs && distance < bestDistance ) {
				best = candidate;
				bestDistance = distance;
			}
		}
	}
	return best === null ? rounded : Math.round( best );
}

/**
 * Format a time as `H:MM:SS.t` (hours unpadded, tenths of a second).
 * Negative input clamps to zero.
 *
 * @param ms - Time in ms.
 * @return The formatted timecode, e.g. `0:01:05.3`.
 */
export function formatTimecode( ms: number ): string {
	const safe = Math.max( 0, Math.round( ms ) );
	const tenths = Math.floor( safe / 100 ) % 10;
	const totalSeconds = Math.floor( safe / 1000 );
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const seconds = totalSeconds % 60;
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return `${ hours }:${ pad( minutes ) }:${ pad( seconds ) }.${ tenths }`;
}

/**
 * Pick the smallest ruler step (from {@link RULER_STEPS_MS}) that keeps at
 * least {@link MIN_TICK_SPACING_PX} between ticks at the given scale. Falls
 * back to the largest step (10 minutes) when even that is too dense.
 *
 * @param pxPerMs - Scale from {@link getPxPerMs}.
 * @return The tick step in ms.
 */
export function pickRulerStep( pxPerMs: number ): number {
	const largest = RULER_STEPS_MS[ RULER_STEPS_MS.length - 1 ];
	if ( pxPerMs <= 0 ) {
		return largest;
	}
	for ( const step of RULER_STEPS_MS ) {
		if ( step * pxPerMs >= MIN_TICK_SPACING_PX ) {
			return step;
		}
	}
	return largest;
}
