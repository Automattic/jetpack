/**
 * Pure geometry for the Studio editor filmstrip.
 *
 * The filmstrip renders at a "natural" tile width at every zoom by
 * re-sampling the source tiles instead of stretching them:
 *
 * - {@link cellWidth} is the anchor — the width at which one source tile
 * displays at native aspect inside the fixed-height row.
 * - {@link quantizeDensity} picks a power-of-two number of source tiles per
 * rendered tile from the current px-per-ms scale, keeping every rendered
 * tile's width within [cellWidth/√2, cellWidth·√2] at any zoom.
 * - {@link sampleIndices} selects which source tiles to show —
 * start-anchored (0, n, 2n, …) so the sample sets nest across densities
 * (n=8 ⊂ n=4 ⊂ n=2 ⊂ n=1): stepping the zoom keeps every coarser tile in
 * place and interleaves new ones.
 * - {@link sampleWidths} turns the ideal per-tile width into whole-px
 * widths whose sum is exactly the track width (no seams, no overflow).
 * - {@link tileBackgroundStyle} draws one sprite cell into a tile box as a
 * pixel-based, centered cover-crop that can never upscale.
 *
 * Below the sprite floor the ladder keeps going: {@link subIntervalStops}
 * derives how many DENSIFIED stops a storyboard supports (halving the
 * effective tile interval per stop while it stays at or above
 * {@link MIN_DENSIFIED_INTERVAL_MS}), the ladder helpers map slider stops to
 * zoom factors across both tiers, {@link sampleTiles} generalizes the
 * sampling to fractional densities — interleaving sprite-aligned tiles with
 * client-extracted ones and naming each extracted tile's dyadic parent (its
 * placeholder) — and {@link visibleWindowTimes} picks which extracted tiles
 * are worth seeking for the current scroll window.
 *
 * Everything here is a pure function of its arguments — no DOM, no React
 * state — so the zoom ladder is unit-testable straight from the design
 * tables.
 */
import type { Storyboard } from '../../../types/edits';
import type { CSSProperties } from 'react';

/**
 * The filmstrip track row height, in px. Must match
 * `.vp-studio-timeline__track--filmstrip` in style.scss.
 */
export const FILMSTRIP_ROW_HEIGHT = 64;

/**
 * Tile aspect ratio assumed when the filmstrip carries no dimensions
 * (frames mode and the loading/unavailable placeholders).
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
 * crop. This anchors the whole ladder — the quantizer keeps rendered tiles
 * within a factor of √2 of it.
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
 * How many source tiles each rendered tile should span at the current
 * timeline scale: the power of two that brings the rendered tile width
 * closest to {@link cellWidth}.
 *
 * `n = 2^max(0, round(log2(cellW / pxPerInterval)))`, where `pxPerInterval`
 * is how many px one source tile's time span occupies. The base unit is the
 * source's real interval — the storyboard payload's `interval_ms` (the
 * wpcom endpoint returns one adaptive sheet whose interval grows with
 * duration; it is NOT always 1s) or `durationMs / frames.length` in
 * extraction mode. Powers of two make the sample sets nest (see
 * {@link sampleIndices}); the floor at `minDensity` (default 1) means zooms
 * past the finest density simply widen the crop window — never skip finer.
 *
 * Densification lowers the floor: a strip with n densified stops passes
 * `minDensity = 2^-n`, letting the quantizer return fractional powers of
 * two (1/2, 1/4, …) — each rendered tile then spans a fraction of one
 * source interval and {@link sampleTiles} interleaves extracted tiles.
 *
 * @param pxPerMs        - Current timeline scale in px per ms.
 * @param baseIntervalMs - Time span of one source tile, in ms.
 * @param cellW          - Native-aspect cell width from {@link cellWidth}.
 * @param minDensity     - Density floor: a power of two ≤ 1 (2^-extraStops).
 * @return Source tiles per rendered tile: a power of two ≥ minDensity (1 on degenerate input).
 */
export function quantizeDensity(
	pxPerMs: number,
	baseIntervalMs: number,
	cellW: number,
	minDensity: number = 1
): number {
	const pxPerInterval = pxPerMs * baseIntervalMs;
	if ( ! ( pxPerInterval > 0 ) || ! ( cellW > 0 ) ) {
		// Unmeasured or degenerate geometry (including NaN): render every
		// source tile rather than guessing a density.
		return 1;
	}
	// log2 of a power of two is exact, so the exponent floor is too. A
	// degenerate minDensity (≤ 0, > 1, NaN) falls back to the classic floor.
	const floor = minDensity > 0 && minDensity <= 1 ? Math.log2( minDensity ) : 0;
	return 2 ** Math.max( floor, Math.round( Math.log2( cellW / pxPerInterval ) ) );
}

/**
 * The source-tile indices to render at a given density: every `density`-th
 * index starting at 0. Start-anchored on purpose — rendered tile i covers
 * `[i·n, (i+1)·n)` intervals and shows the FIRST source tile of its span,
 * so the sample set at density 2n is a subset of the set at density n and
 * tiles stay aligned with the ruler's interval boundaries.
 *
 * @param sourceCount - Total number of source tiles (sprite tiles or frames).
 * @param density     - Source tiles per rendered tile from {@link quantizeDensity}.
 * @return Ascending source indices; empty when there are no source tiles.
 */
export function sampleIndices( sourceCount: number, density: number ): number[] {
	const step = Math.max( 1, Math.floor( density ) );
	const indices: number[] = [];
	for ( let index = 0; index < sourceCount; index += step ) {
		indices.push( index );
	}
	return indices;
}

/**
 * One rendered filmstrip tile from {@link sampleTiles}.
 */
export type FilmstripTile = {
	/**
	 * The tile's start-anchored time in ms — its identity across densities
	 * (the dyadic sample sets nest by time) and its extraction seek time
	 * when it is off the source grid.
	 */
	timeMs: number;
	/**
	 * Source tile index when the tile's time lands on the source grid;
	 * null for a densified tile that must be client-extracted.
	 */
	spriteIndex: number | null;
	/**
	 * The source tile whose span contains this tile's time. Equals
	 * `spriteIndex` for on-grid tiles; for extracted tiles it is the dyadic
	 * parent — the coarser sprite tile that serves as the placeholder until
	 * the extracted frame lands (never blank, never stretched).
	 */
	parentIndex: number;
};

/**
 * Sample a source strip into rendered tiles at any density, integer or
 * fractional. At density ≥ 1 this is {@link sampleIndices} with times: every
 * `density`-th source tile, all on-grid. Below 1 (a densified stop) each
 * source interval splits into `1/density` start-anchored tiles: the first
 * lands on the source grid (dyadic subset property — the sprite already has
 * it), the rest carry `spriteIndex: null` and must be extracted client-side.
 *
 * @param sourceCount    - Total number of source tiles (sprite tiles or frames).
 * @param baseIntervalMs - Time span of one source tile, in ms.
 * @param density        - Source tiles per rendered tile from {@link quantizeDensity}.
 * @return The rendered tiles in playback order; empty when there is no source.
 */
export function sampleTiles(
	sourceCount: number,
	baseIntervalMs: number,
	density: number
): FilmstripTile[] {
	if ( sourceCount <= 0 ) {
		return [];
	}
	if ( ! ( density > 0 ) || density >= 1 ) {
		// Degenerate densities (0, negative, NaN) render every source tile.
		return sampleIndices( sourceCount, density > 0 ? density : 1 ).map( index => ( {
			timeMs: Math.round( index * baseIntervalMs ),
			spriteIndex: index,
			parentIndex: index,
		} ) );
	}
	const perSource = Math.max( 1, Math.round( 1 / density ) );
	const count = sourceCount * perSource;
	const tiles: FilmstripTile[] = [];
	for ( let position = 0; position < count; position++ ) {
		const parentIndex = Math.floor( position / perSource );
		tiles.push( {
			// Rounded the same way at every density, so a time that appears
			// at two densities gets the same integer (the extraction cache
			// and React keys both key off it).
			timeMs: Math.round( ( position * baseIntervalMs ) / perSource ),
			spriteIndex: position % perSource === 0 ? parentIndex : null,
			parentIndex,
		} );
	}
	return tiles;
}

/**
 * The extraction-worthy subset of tile times for the current scroll window:
 * the times whose tiles intersect the viewport padded by one viewport width
 * on each side (the design doc's "scrollLeft ± one viewport"). Off-window
 * tiles render their dyadic placeholder without costing a seek; scrolling
 * re-derives the window and the pool prioritizes the newest request.
 *
 * @param timesMs     - Candidate tile start times in ms (the extracted tiles).
 * @param spanMs      - Each tile's time span in ms (density × base interval).
 * @param scrollLeft  - The scroller's current scrollLeft, in px.
 * @param clientWidth - The scroller's visible width, in px.
 * @param pxPerMs     - Current timeline scale in px per ms.
 * @return The times to request, in playback order; empty on degenerate geometry.
 */
export function visibleWindowTimes(
	timesMs: number[],
	spanMs: number,
	scrollLeft: number,
	clientWidth: number,
	pxPerMs: number
): number[] {
	if ( ! ( pxPerMs > 0 ) || ! ( clientWidth > 0 ) || ! ( spanMs > 0 ) ) {
		return [];
	}
	const startMs = ( scrollLeft - clientWidth ) / pxPerMs;
	const endMs = ( scrollLeft + 2 * clientWidth ) / pxPerMs;
	return timesMs.filter( timeMs => timeMs + spanMs > startMs && timeMs < endMs );
}

/**
 * Distribute the track width over the rendered tiles: interior tile
 * boundaries land on whole px (no hairline seams between backgrounds) at
 * multiples of the ideal width, and the last boundary is exactly
 * `trackWidth`, so the widths always sum to the track width — the tile row
 * can neither leave a gap nor overflow the timeline's shared scale. The
 * last tile absorbs both the rounding residue and the remainder of a
 * source-tile count that doesn't divide evenly by the density.
 *
 * @param count       - Number of rendered tiles.
 * @param pxPerSample - Ideal rendered-tile width in px (density × px per interval).
 * @param trackWidth  - Total track width in px (the timeline's zoomed content width).
 * @return One width per rendered tile; empty on degenerate input.
 */
export function sampleWidths( count: number, pxPerSample: number, trackWidth: number ): number[] {
	if ( count <= 0 || trackWidth <= 0 ) {
		return [];
	}
	const widths: number[] = [];
	let previous = 0;
	for ( let index = 1; index <= count; index++ ) {
		const boundary =
			index === count ? trackWidth : Math.min( trackWidth, Math.round( index * pxPerSample ) );
		widths.push( boundary - previous );
		previous = boundary;
	}
	return widths;
}

/**
 * Compute one storyboard tile's cover-crop background style.
 *
 * The sheet is drawn at `scale = min(1, max(w/tileW, rowH/tileH))` — the
 * classic cover factor, clamped at 1 so upscaling is structurally
 * impossible — and positioned so the tile's sprite cell is centered in the
 * box. Narrow boxes therefore show a centered crop of the frame (matching
 * frames-mode `object-fit: cover`) rather than a squeezed one, and wide
 * boxes can never smear pixels. Whole-px rounding avoids hairline seams.
 *
 * @param storyboard - The storyboard descriptor.
 * @param index      - Sprite tile index (row-major within the sprite).
 * @param tileWidth  - The tile box's rendered width, in px.
 * @param rowHeight  - The tile box's rendered height, in px.
 * @return The tile's CSS properties; empty on degenerate geometry.
 */
export function tileBackgroundStyle(
	storyboard: Storyboard,
	index: number,
	tileWidth: number,
	rowHeight: number = FILMSTRIP_ROW_HEIGHT
): CSSProperties {
	const { tile_width: tileW, tile_height: tileH } = storyboard;
	if ( tileWidth <= 0 || tileW <= 0 || tileH <= 0 ) {
		// Unmeasured viewport or degenerate sprite geometry: paint nothing
		// rather than a mis-cropped sheet.
		return {};
	}
	// Prefer the sprite's real row count: the sheet is a fixed columns x rows
	// cell grid padded with blank cells past `tiles`, so ceil(tiles/columns)
	// under-counts the rows, mis-sizes the drawn sheet, and bleeds the blank
	// padding into every tile. Fall back to the derivation only when the
	// backend omits `rows`.
	const rows =
		storyboard.rows && storyboard.rows > 0
			? storyboard.rows
			: Math.max( 1, Math.ceil( storyboard.tiles / storyboard.columns ) );
	const column = index % storyboard.columns;
	const row = Math.floor( index / storyboard.columns );
	const scale = Math.min( 1, Math.max( tileWidth / tileW, rowHeight / tileH ) );
	const cellW = tileW * scale;
	const cellH = tileH * scale;
	return {
		// Quoted, so URLs containing CSS-significant characters stay intact.
		backgroundImage: `url("${ storyboard.url }")`,
		backgroundSize: `${ Math.round( storyboard.columns * cellW ) }px ${ Math.round(
			rows * cellH
		) }px`,
		backgroundPosition: `${ Math.round(
			( tileWidth - cellW ) / 2 - column * cellW
		) }px ${ Math.round( ( rowHeight - cellH ) / 2 - row * cellH ) }px`,
	};
}
