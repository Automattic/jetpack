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
 * {@link sampleIndices}); the floor at 1 means zooms past the source
 * density simply widen the crop window — never skip below one interval.
 *
 * @param pxPerMs        - Current timeline scale in px per ms.
 * @param baseIntervalMs - Time span of one source tile, in ms.
 * @param cellW          - Native-aspect cell width from {@link cellWidth}.
 * @return Source tiles per rendered tile: a power of two ≥ 1 (1 on degenerate input).
 */
export function quantizeDensity( pxPerMs: number, baseIntervalMs: number, cellW: number ): number {
	const pxPerInterval = pxPerMs * baseIntervalMs;
	if ( ! ( pxPerInterval > 0 ) || ! ( cellW > 0 ) ) {
		// Unmeasured or degenerate geometry (including NaN): render every
		// source tile rather than guessing a density.
		return 1;
	}
	return 2 ** Math.max( 0, Math.round( Math.log2( cellW / pxPerInterval ) ) );
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
