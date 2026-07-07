/**
 * Filmstrip track for the Studio editor timeline.
 *
 * Renders per filmstrip mode: storyboard shows tiles cut from the server
 * sprite via pixel-based cover-crop backgrounds; frames shows one <img> per
 * client-extracted frame (object URLs) with the equivalent
 * `object-fit: cover`; loading, unavailable, and an absent prop all keep
 * the neutral gradient placeholder.
 *
 * Sampling: instead of stretching every source tile across the zoomed
 * width, the track re-samples. The quantizer (filmstrip-geometry) picks a
 * power-of-two number of source tiles per rendered tile from the current
 * px-per-ms scale, so rendered tiles stay near their native-aspect width at
 * ANY zoom — including the continuous zooms the wheel produces between the
 * slider's discrete stops. The base time unit is the source's real
 * interval: the storyboard's `interval_ms` (the wpcom endpoint serves one
 * adaptive sheet — its interval grows with duration and is not always 1s)
 * or `durationMs / frames.length` in extraction mode.
 *
 * Layout: tiles are `flex: 0 0 auto` boxes with explicit widths from
 * sampleWidths — interior boundaries on whole px, last tile takes the
 * remainder — so the widths sum to exactly `trackWidth`. The timeline pins
 * the track's row box to that same `trackWidth`, which keeps the tiles on
 * the one shared horizontal scale: a row that instead sized itself from
 * its parent could render wider or narrower than `trackWidth` (stale
 * viewport measurements, `min-width: 100%` stretch) and would put the
 * tiles on a different scale than the ruler.
 *
 * Purely presentational and decorative (aria-hidden). Pointer events bubble
 * to the timeline content's scrub surface, exactly like the placeholder the
 * track replaces.
 */
import {
	cellWidth,
	FILMSTRIP_ROW_HEIGHT,
	quantizeDensity,
	sampleIndices,
	sampleWidths,
	tileBackgroundStyle,
} from './filmstrip-geometry';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { ReactElement } from 'react';

/**
 * The maximum useful timeline zoom for a filmstrip: the zoom at which its
 * tiles render at native aspect in the {@link FILMSTRIP_ROW_HEIGHT} row
 * (`tiles × cellWidth / viewportWidth`). Past it the strip could only
 * upscale, so the timeline uses this as the hard zoom ceiling.
 *
 * Tile count and aspect come from the resolved strip: the storyboard's
 * `tiles` (the sprite's real tile count — the cap is interval-independent)
 * and `tile_width/tile_height` in storyboard mode, the frame count (at the
 * 16:9 fallback aspect — extracted frames carry no dimensions) in frames
 * mode. While the strip is loading or unavailable the count falls back to
 * the one-tile-per-second density a client extraction would produce,
 * `ceil(durationMs / 1000)`, so the cap is duration-scaled rather than
 * arbitrary.
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
	let cellW = cellWidth();
	if ( state.status === 'storyboard' ) {
		tiles = state.storyboard.tiles;
		cellW = cellWidth( state.storyboard.tile_width, state.storyboard.tile_height );
	} else if ( state.status === 'frames' ) {
		tiles = state.frames.length;
	} else {
		tiles = Math.ceil( durationMs / 1000 );
	}
	return Math.max( 1, ( tiles * cellW ) / viewportWidth );
}

type Props = {
	/** Filmstrip state from useFilmstrip; absent renders the placeholder. */
	filmstrip?: FilmstripState;
	/**
	 * Rendered width of the whole track (the timeline's zoomed content
	 * width), in px. Sampled tile widths always sum to exactly this value;
	 * 0 or absent (an unmeasured viewport) renders every source tile with
	 * no explicit geometry.
	 */
	trackWidth?: number;
	/**
	 * Master duration in ms. With `trackWidth` it fixes the px-per-ms scale
	 * the quantizer samples against; 0 or absent renders every source tile
	 * at an equal share of the track.
	 */
	durationMs?: number;
};

type SampleLayout = {
	/** Source-tile indices to render, ascending. */
	indices: number[];
	/** One width per rendered tile (sums to trackWidth), or null when unmeasured. */
	widths: number[] | null;
};

/**
 * Sample a source strip against the current timeline scale: quantize the
 * density, pick the nested start-anchored subset, and pin the rendered
 * widths to the track width.
 *
 * @param sourceCount    - Total source tiles (sprite tiles or frames).
 * @param baseIntervalMs - Time span of one source tile, in ms.
 * @param cellW          - Native-aspect cell width for this strip.
 * @param trackWidth     - Rendered track width in px.
 * @param durationMs     - Master duration in ms.
 * @return The sampled indices and their rendered widths.
 */
function sampleLayout(
	sourceCount: number,
	baseIntervalMs: number,
	cellW: number,
	trackWidth: number,
	durationMs: number
): SampleLayout {
	const pxPerMs = trackWidth > 0 && durationMs > 0 ? trackWidth / durationMs : 0;
	const density = quantizeDensity( pxPerMs, baseIntervalMs, cellW );
	const indices = sampleIndices( sourceCount, density );
	if ( trackWidth <= 0 || indices.length === 0 ) {
		return { indices, widths: null };
	}
	// Without a usable duration the scale is unknowable; fall back to an
	// equal split so the strip still fills the measured track.
	const pxPerSample =
		pxPerMs > 0 ? density * baseIntervalMs * pxPerMs : trackWidth / indices.length;
	return { indices, widths: sampleWidths( indices.length, pxPerSample, trackWidth ) };
}

/**
 * The filmstrip track.
 *
 * @param props            - Component props.
 * @param props.filmstrip  - Filmstrip state from useFilmstrip.
 * @param props.trackWidth - Rendered track width in px (the zoomed content width).
 * @param props.durationMs - Master duration in ms.
 * @return The track element.
 */
export default function StudioEditorFilmstripTrack( {
	filmstrip,
	trackWidth = 0,
	durationMs = 0,
}: Props ): ReactElement {
	const state: FilmstripState = filmstrip ?? { status: 'unavailable' };

	if ( state.status === 'storyboard' ) {
		const { storyboard } = state;
		const { indices, widths } = sampleLayout(
			storyboard.tiles,
			storyboard.interval_ms,
			cellWidth( storyboard.tile_width, storyboard.tile_height ),
			trackWidth,
			durationMs
		);
		return (
			<div
				className="vp-studio-timeline__filmstrip"
				data-testid="studio-timeline-filmstrip"
				data-mode="storyboard"
				aria-hidden="true"
			>
				{ indices.map( ( spriteIndex, position ) => {
					const width = widths?.[ position ];
					return (
						<div
							// Sprite index, not position: the start-anchored samples
							// nest across densities, so tiles keep their identity
							// (and loaded backgrounds) when the zoom steps.
							key={ spriteIndex }
							className="vp-studio-timeline__filmstrip-tile"
							data-testid="studio-timeline-filmstrip-tile"
							data-index={ spriteIndex }
							style={
								width === undefined
									? undefined
									: {
											width: `${ width }px`,
											...tileBackgroundStyle( storyboard, spriteIndex, width ),
									  }
							}
						/>
					);
				} ) }
			</div>
		);
	}

	if ( state.status === 'frames' ) {
		const { frames } = state;
		const { indices, widths } = sampleLayout(
			frames.length,
			frames.length > 0 ? durationMs / frames.length : 0,
			cellWidth(),
			trackWidth,
			durationMs
		);
		return (
			<div
				className="vp-studio-timeline__filmstrip"
				data-testid="studio-timeline-filmstrip"
				data-mode="frames"
				aria-hidden="true"
			>
				{ indices.map( ( frameIndex, position ) => {
					const width = widths?.[ position ];
					return (
						<img
							key={ frames[ frameIndex ] }
							className="vp-studio-timeline__filmstrip-tile"
							data-testid="studio-timeline-filmstrip-tile"
							data-index={ frameIndex }
							src={ frames[ frameIndex ] }
							style={ width === undefined ? undefined : { width: `${ width }px` } }
							alt=""
							draggable={ false }
						/>
					);
				} ) }
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
