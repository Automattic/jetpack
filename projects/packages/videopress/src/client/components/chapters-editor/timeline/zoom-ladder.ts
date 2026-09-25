/**
 * The timeline's zoom ladder: the pure ladder math extracted from the
 * studio editor's filmstrip geometry, reduced to the filmstrip-less branch.
 *
 * The chapters strip draws no filmstrip tiles, but it keeps the filmstrip's
 * zoom grammar so the stops stay meaningful (and identical to the studio
 * tools if a filmstrip strip ever ships here): the ladder is anchored at the
 * zoom where a one-tile-per-second strip would render at native aspect in
 * the {@link FILMSTRIP_ROW_HEIGHT} row — `ceil(durationMs / 1000) ×
 * cellWidth / viewportWidth` — with geometrically spaced stops between fit
 * (zoom 1) and that anchor, and no densified stops past it.
 *
 * Everything here is a pure function of its arguments — no DOM, no React
 * state — so the zoom ladder is unit-testable straight from the design
 * tables.
 */

/**
 * The filmstrip row height the ladder's cell-width anchor assumes, in px
 * (the studio filmstrip's fixed track row height).
 */
export const FILMSTRIP_ROW_HEIGHT = 64;

/**
 * Tile aspect ratio assumed when the strip carries no dimensions.
 */
const FALLBACK_TILE_ASPECT = 16 / 9;

/**
 * Slider stops between fit (step 0) and the source-density stop: the
 * geometric tier of the ladder, `zoom(k) = sourceZoom^(k / BASE_ZOOM_STEPS)`.
 * Densified stops extend past this index by doubling.
 */
export const BASE_ZOOM_STEPS = 3;

/**
 * The finest effective tile interval the densified tier may reach. Halving
 * stops are only offered while the halved interval stays at or above this —
 * sub-second granularity is deliberately out of scope (deferred with the
 * design doc's sub-second tier).
 */
export const MIN_DENSIFIED_INTERVAL_MS = 1000;

/**
 * A timeline zoom ladder: the geometric tier's anchor plus how many
 * densified (interval-halving) stops extend past it.
 */
export type ZoomLadder = {
	/**
	 * Zoom of the source-density stop — where source tiles render at native
	 * aspect (getFilmstripZoomMax). The hard ceiling when `extraStops` is 0.
	 */
	sourceZoom: number;
	/** Densified stops past the source stop; each one doubles the zoom. */
	extraStops: number;
};

/**
 * How many densified stops a source strip supports: the number of times its
 * tile interval can halve while staying at or above `minIntervalMs`. The
 * adaptive wpcom sheet floors long videos at coarse intervals (6s at 10min,
 * 18s at 30min), so this is exactly where densification pays: a 6000ms sheet
 * gets stops at 3000ms and 1500ms; a 1000ms sheet gets none.
 *
 * @param baseIntervalMs - Time span of one source tile, in ms.
 * @param minIntervalMs  - The finest allowed effective interval, in ms.
 * @return The number of halving stops; 0 on degenerate input.
 */
export function subIntervalStops(
	baseIntervalMs: number,
	minIntervalMs: number = MIN_DENSIFIED_INTERVAL_MS
): number {
	if ( ! ( baseIntervalMs > 0 ) || ! ( minIntervalMs > 0 ) ) {
		return 0;
	}
	return Math.max( 0, Math.floor( Math.log2( baseIntervalMs / minIntervalMs ) ) );
}

/**
 * The ladder's highest slider stop index (stop 0 is fit).
 *
 * @param ladder - The zoom ladder.
 * @return The top stop index, at least BASE_ZOOM_STEPS.
 */
export function ladderStepCount( ladder: ZoomLadder ): number {
	return BASE_ZOOM_STEPS + Math.max( 0, Math.floor( ladder.extraStops ) );
}

/**
 * The ladder's absolute zoom ceiling: the source-density zoom doubled once
 * per densified stop. Replaces the bare `sourceZoom` cap wherever the
 * strip supports densification.
 *
 * @param ladder - The zoom ladder.
 * @return The zoom ceiling, always ≥ 1.
 */
export function ladderMaxZoom( ladder: ZoomLadder ): number {
	return Math.max( 1, ladder.sourceZoom ) * 2 ** Math.max( 0, Math.floor( ladder.extraStops ) );
}

/**
 * Map a slider stop to its zoom factor: geometric spacing up to the source
 * stop (`sourceZoom^(k / BASE_ZOOM_STEPS)`), then doubling per densified
 * stop (`sourceZoom × 2^(k − BASE_ZOOM_STEPS)`), so every densified stop
 * halves the effective tile interval — the dyadic sampling stays aligned
 * with the sprite grid.
 *
 * @param step   - Slider stop index; clamped to the ladder's range.
 * @param ladder - The zoom ladder.
 * @return The stop's zoom factor in [1, ladderMaxZoom].
 */
export function ladderZoomForStep( step: number, ladder: ZoomLadder ): number {
	const sourceZoom = Math.max( 1, ladder.sourceZoom );
	const clamped = Math.min( ladderStepCount( ladder ), Math.max( 0, Math.round( step ) ) );
	if ( clamped <= BASE_ZOOM_STEPS ) {
		// sourceZoom 1 would make the exponent moot; short-circuit the ** for
		// exactness at the anchors.
		return sourceZoom === 1 ? 1 : sourceZoom ** ( clamped / BASE_ZOOM_STEPS );
	}
	return sourceZoom * 2 ** ( clamped - BASE_ZOOM_STEPS );
}

/**
 * Map a zoom factor to its nearest slider stop — nearest in log space,
 * matching zoom's multiplicative perception. The wheel path keeps zoom
 * continuous; the slider only displays (and reports) whole stops.
 *
 * @param zoom   - Zoom factor; clamped to [1, ladderMaxZoom].
 * @param ladder - The zoom ladder.
 * @return The nearest stop index in [0, ladderStepCount].
 */
export function ladderStepForZoom( zoom: number, ladder: ZoomLadder ): number {
	const target = Math.log( Math.min( ladderMaxZoom( ladder ), Math.max( 1, zoom ) ) );
	let best = 0;
	let bestDistance = Infinity;
	for ( let step = 0; step <= ladderStepCount( ladder ); step++ ) {
		const distance = Math.abs( Math.log( ladderZoomForStep( step, ladder ) ) - target );
		if ( distance < bestDistance ) {
			best = step;
			bestDistance = distance;
		}
	}
	return best;
}

/**
 * Native-aspect display width of one source tile at the filmstrip row
 * height: the width at which a tile renders with zero stretch and zero
 * crop. This anchors the whole ladder.
 *
 * @param tileWidth  - Source tile width in px; non-positive/absent falls back to 16:9.
 * @param tileHeight - Source tile height in px; non-positive/absent falls back to 16:9.
 * @param rowHeight  - Filmstrip row height in px.
 * @return The native-aspect cell width in px.
 */
export function cellWidth(
	tileWidth = 0,
	tileHeight = 0,
	rowHeight: number = FILMSTRIP_ROW_HEIGHT
): number {
	const aspect = tileWidth > 0 && tileHeight > 0 ? tileWidth / tileHeight : FALLBACK_TILE_ASPECT;
	return rowHeight * aspect;
}

/**
 * The maximum useful timeline zoom: the zoom at which a strip at the
 * one-tile-per-second density a client extraction would produce —
 * `ceil(durationMs / 1000)` tiles at the 16:9 fallback cell width — renders
 * at native aspect in the {@link FILMSTRIP_ROW_HEIGHT} row. Past it a
 * filmstrip could only upscale, so this anchors the zoom ladder's
 * source-density stop and keeps the cap duration-scaled rather than
 * arbitrary.
 *
 * @param durationMs    - Master duration in ms.
 * @param viewportWidth - Visible timeline width in px.
 * @return The zoom ceiling, always ≥ 1 (1 = the strip already fits unstretched).
 */
export function getFilmstripZoomMax( durationMs: number, viewportWidth: number ): number {
	if ( viewportWidth <= 0 ) {
		return 1;
	}
	const tiles = Math.ceil( durationMs / 1000 );
	return Math.max( 1, ( tiles * cellWidth() ) / viewportWidth );
}

/**
 * The strip's full zoom ladder: {@link getFilmstripZoomMax} as the
 * source-density anchor with no densified stops — only a storyboard
 * densifies, and this filmstrip-less strip has none — so the ladder is the
 * plain geometric one.
 *
 * @param durationMs    - Master duration in ms.
 * @param viewportWidth - Visible timeline width in px.
 * @return The zoom ladder for this strip.
 */
export function getFilmstripZoomLadder( durationMs: number, viewportWidth: number ): ZoomLadder {
	return {
		sourceZoom: getFilmstripZoomMax( durationMs, viewportWidth ),
		extraStops: 0,
	};
}
