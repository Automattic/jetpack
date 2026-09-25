/**
 * Timeline math for the chapters editor: pixel↔millisecond mapping,
 * timecode formatting, and adaptive ruler steps.
 *
 * The timeline renders the full master duration across
 * `viewportWidth * zoom` pixels, so `pxPerMs = viewportWidth * zoom /
 * durationMs`. All millisecond values are integers on the original master
 * timeline.
 */

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
