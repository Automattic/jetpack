/**
 * Filmstrip track for the Studio editor timeline.
 *
 * Renders per filmstrip mode: storyboard shows equal-width tiles cut from
 * the server sprite via pixel-based cover-crop backgrounds — the sheet is
 * only ever drawn at or below its natural size, so zooming widens each
 * tile's crop window instead of stretching pixels; frames shows one <img>
 * per client-extracted frame (object URLs) with the equivalent
 * `object-fit: cover` — no re-extraction on zoom in v1; loading,
 * unavailable, and an absent prop all keep the neutral gradient placeholder.
 *
 * Layout: tiles keep the original `flex: 1 1 0` equal-width flex layout.
 * The cover-crop math only needs to KNOW each tile's rendered width — which
 * is exactly `trackWidth / tiles` under that layout — so the timeline passes
 * its zoomed content width down instead of the track measuring or sizing
 * anything itself. The timeline also pins the track's row box to that same
 * `trackWidth`, which is what makes the equality hold: a row that instead
 * filled its parent could render wider or narrower than `trackWidth`
 * (stale viewport measurements, `min-width: 100%` stretch) and would put
 * the tiles on a different horizontal scale than the ruler.
 *
 * Purely presentational and decorative (aria-hidden). Pointer events bubble
 * to the timeline content's scrub surface, exactly like the placeholder the
 * track replaces.
 */
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../types/edits';
import type { CSSProperties, ReactElement } from 'react';

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
 * The maximum useful timeline zoom for a filmstrip: the zoom at which its
 * tiles render at native aspect in the {@link FILMSTRIP_ROW_HEIGHT} row
 * (`tiles × cellWidth / viewportWidth`, cellWidth = rowHeight × aspect).
 * Past it the strip could only upscale, so the timeline uses this as the
 * hard zoom ceiling.
 *
 * Tile count and aspect come from the resolved strip: the storyboard's
 * `tiles` and `tile_width/tile_height` in storyboard mode, the frame count
 * (at the {@link FALLBACK_TILE_ASPECT} assumption — extracted frames carry
 * no dimensions) in frames mode. While the strip is loading or unavailable
 * the count falls back to the one-tile-per-second density a client
 * extraction would produce, `ceil(durationMs / 1000)`, so the cap is
 * duration-scaled rather than arbitrary.
 *
 * @param filmstrip     - Filmstrip state; absent behaves like 'unavailable'.
 * @param durationMs    - Master duration in ms (the loading/unavailable fallback).
 * @param viewportWidth - Visible timeline width in px.
 * @return The zoom ceiling, always ≥ 1 (1 = the strip already fits unstretched).
 */
export function getFilmstripZoomMax(
	filmstrip: FilmstripState | undefined,
	durationMs: number,
	viewportWidth: number
): number {
	if ( viewportWidth <= 0 ) {
		return 1;
	}
	const state: FilmstripState = filmstrip ?? { status: 'unavailable' };
	let tiles: number;
	let aspect = FALLBACK_TILE_ASPECT;
	if ( state.status === 'storyboard' ) {
		tiles = state.storyboard.tiles;
		if ( state.storyboard.tile_width > 0 && state.storyboard.tile_height > 0 ) {
			aspect = state.storyboard.tile_width / state.storyboard.tile_height;
		}
	} else if ( state.status === 'frames' ) {
		tiles = state.frames.length;
	} else {
		tiles = Math.ceil( durationMs / 1000 );
	}
	const cellWidth = FILMSTRIP_ROW_HEIGHT * aspect;
	return Math.max( 1, ( tiles * cellWidth ) / viewportWidth );
}

type Props = {
	/** Filmstrip state from useFilmstrip; absent renders the placeholder. */
	filmstrip?: FilmstripState;
	/**
	 * Rendered width of the whole track (the timeline's zoomed content
	 * width), in px. Storyboard tiles need it to size their cover-crop;
	 * 0 or absent (an unmeasured viewport) paints no tile backgrounds.
	 */
	trackWidth?: number;
};

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
 * @param index      - Tile index (row-major within the sprite).
 * @param tileWidth  - The tile box's rendered width, in px.
 * @return The tile's CSS properties.
 */
function storyboardTileStyle(
	storyboard: Storyboard,
	index: number,
	tileWidth: number
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
	const scale = Math.min( 1, Math.max( tileWidth / tileW, FILMSTRIP_ROW_HEIGHT / tileH ) );
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
		) }px ${ Math.round( ( FILMSTRIP_ROW_HEIGHT - cellH ) / 2 - row * cellH ) }px`,
	};
}

/**
 * The filmstrip track.
 *
 * @param props            - Component props.
 * @param props.filmstrip  - Filmstrip state from useFilmstrip.
 * @param props.trackWidth - Rendered track width in px (the zoomed content width).
 * @return The track element.
 */
export default function StudioEditorFilmstripTrack( {
	filmstrip,
	trackWidth = 0,
}: Props ): ReactElement {
	const state: FilmstripState = filmstrip ?? { status: 'unavailable' };

	if ( state.status === 'storyboard' ) {
		const { storyboard } = state;
		const tileWidth = storyboard.tiles > 0 ? trackWidth / storyboard.tiles : 0;
		return (
			<div
				className="vp-studio-timeline__filmstrip"
				data-testid="studio-timeline-filmstrip"
				data-mode="storyboard"
				aria-hidden="true"
			>
				{ Array.from( { length: storyboard.tiles }, ( _, index ) => (
					<div
						key={ index }
						className="vp-studio-timeline__filmstrip-tile"
						data-testid="studio-timeline-filmstrip-tile"
						style={ storyboardTileStyle( storyboard, index, tileWidth ) }
					/>
				) ) }
			</div>
		);
	}

	if ( state.status === 'frames' ) {
		return (
			<div
				className="vp-studio-timeline__filmstrip"
				data-testid="studio-timeline-filmstrip"
				data-mode="frames"
				aria-hidden="true"
			>
				{ state.frames.map( frame => (
					<img
						key={ frame }
						className="vp-studio-timeline__filmstrip-tile"
						data-testid="studio-timeline-filmstrip-tile"
						src={ frame }
						alt=""
						draggable={ false }
					/>
				) ) }
			</div>
		);
	}

	// 'loading' and 'unavailable' share the neutral gradient.
	return (
		<div
			className="vp-studio-timeline__filmstrip-placeholder"
			data-testid="studio-timeline-filmstrip"
			data-mode={ state.status }
			aria-hidden="true"
		/>
	);
}
