export interface SnapContext {
	pxPerMs: number;
	durationMs: number;
	playheadMs?: number;
	edgesMs?: number[];
	thresholdPx?: number;
}

/**
 * Snap a range's nearest edge without changing its width.
 *
 * @param startMs - Requested start in milliseconds.
 * @param widthMs - Width to preserve; zero for a single edge.
 * @param context - Timeline scale and snap targets.
 * @return The snapped start in milliseconds.
 */
export function snapMoveMs( startMs: number, widthMs: number, context: SnapContext ): number {
	const rounded = Math.round( startMs );
	if ( context.pxPerMs <= 0 ) {
		return rounded;
	}
	const targets = [ 0, context.durationMs, ...( context.edgesMs ?? [] ) ];
	if ( context.playheadMs !== undefined ) {
		targets.push( context.playheadMs );
	}
	let best = rounded;
	let distance = ( context.thresholdPx ?? 8 ) / context.pxPerMs;
	for ( const target of targets ) {
		for ( const candidate of [ target, target - widthMs ] ) {
			const adjustment = Math.abs( rounded - candidate );
			if ( adjustment < distance ) {
				best = candidate;
				distance = adjustment;
			}
		}
	}
	return Math.round( best );
}

/**
 * Snap a single edge to the nearest timeline target.
 *
 * @param ms      - Requested position in milliseconds.
 * @param context - Timeline scale and snap targets.
 * @return The snapped position in milliseconds.
 */
export function snapMs( ms: number, context: SnapContext ): number {
	return snapMoveMs( ms, 0, context );
}
