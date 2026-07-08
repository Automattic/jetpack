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
 * Densification (below the sprite floor): a storyboard whose interval can
 * halve while staying ≥ MIN_DENSIFIED_INTERVAL_MS supports extra zoom stops
 * past its native density. There the quantizer returns fractional densities
 * and each source interval splits into start-anchored sub-tiles: the
 * on-grid ones still render straight from the sprite (dyadic subset
 * property), while the off-grid ones are lazily client-extracted through
 * the frame-extraction pool — but ONLY for the visible window (the scroller
 * viewport ± one viewport width; scrolling re-derives the window and the
 * pool seeks the newest request first). Until an extracted frame lands (and
 * for every off-window tile) the tile renders its dyadic parent — the
 * coarser sprite tile whose span contains its time — as a cover-crop
 * placeholder: never blank, never stretched, and by the same clamped cover
 * math, never upscaled.
 *
 * Layout: tiles are `flex: 0 0 auto` boxes with explicit widths from
 * sampleWidths — interior boundaries on whole px, last tile takes the
 * remainder — so the widths sum to exactly `trackWidth` at every stop,
 * densified ones included. The timeline pins the track's row box to that
 * same `trackWidth`, which keeps the tiles on the one shared horizontal
 * scale: a row that instead sized itself from its parent could render wider
 * or narrower than `trackWidth` (stale viewport measurements,
 * `min-width: 100%` stretch) and would put the tiles on a different scale
 * than the ruler.
 *
 * Purely presentational and decorative (aria-hidden). Pointer events bubble
 * to the timeline content's scrub surface, exactly like the placeholder the
 * track replaces.
 */
import { useEffect, useMemo, useState } from 'react';
import {
	cellWidth,
	FILMSTRIP_ROW_HEIGHT,
	quantizeDensity,
	sampleIndices,
	sampleTiles,
	sampleWidths,
	subIntervalStops,
	tileBackgroundStyle,
	visibleWindowTimes,
} from './filmstrip-geometry';
import type { FilmstripTile, ZoomLadder } from './filmstrip-geometry';
import type { FilmstripState, FrameExtractionPool } from '../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../types/edits';
import type { ReactElement } from 'react';

/**
 * Trailing-edge throttle for scroll-driven extraction syncs: at most one
 * visible-window re-derivation per this many ms while scrolling. Scroll
 * events fire per frame; seeks cost 100–300ms each, so reacting more often
 * than this would only churn the pool's queue.
 */
export const SCROLL_SYNC_DELAY_MS = 150;

/** Stable empty results so effect/memo dependencies don't churn. */
const NO_TIMES: number[] = [];
const NO_FRAMES: ReadonlyMap< number, string > = new Map();

/**
 * The maximum useful timeline zoom for a filmstrip: the zoom at which its
 * tiles render at native aspect in the {@link FILMSTRIP_ROW_HEIGHT} row
 * (`tiles × cellWidth / viewportWidth`). Past it the strip could only
 * upscale, so this anchors the zoom ladder's source-density stop.
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

/**
 * The filmstrip's full zoom ladder: {@link getFilmstripZoomMax} as the
 * source-density anchor, extended by one doubling stop per interval halving
 * the storyboard supports (subIntervalStops). Only a storyboard densifies —
 * frames mode and the loading/unavailable fallbacks keep the plain
 * geometric ladder — so densification is the sole route below the sprite's
 * `interval_ms`, exactly as spec'd.
 *
 * @param filmstrip     - Filmstrip state; absent behaves like 'unavailable'.
 * @param durationMs    - Master duration in ms (the loading/unavailable fallback).
 * @param viewportWidth - Visible timeline width in px.
 * @return The zoom ladder for this strip.
 */
export function getFilmstripZoomLadder(
	filmstrip: FilmstripState | undefined,
	durationMs: number,
	viewportWidth: number
): ZoomLadder {
	return {
		sourceZoom: getFilmstripZoomMax( filmstrip, durationMs, viewportWidth ),
		extraStops:
			filmstrip?.status === 'storyboard' ? subIntervalStops( filmstrip.storyboard.interval_ms ) : 0,
	};
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
	/**
	 * Frame-extraction pool for densified tiles (useFrameExtractionPool).
	 * Absent, densified stops still render — every off-grid tile keeps its
	 * dyadic-parent placeholder.
	 */
	extractionPool?: FrameExtractionPool | null;
	/**
	 * The timeline's horizontal scroller (the shell context's scrollerEl).
	 * Fixes the visible window for lazy extraction; absent, nothing is
	 * requested.
	 */
	scrollerEl?: HTMLElement | null;
};

type StoryboardLayout = {
	/** Rendered tiles in playback order. */
	tiles: FilmstripTile[];
	/** One width per rendered tile (sums to trackWidth), or null when unmeasured. */
	widths: number[] | null;
	/** Each rendered tile's time span in ms (density × interval_ms). */
	spanMs: number;
	/** Track scale in px per ms; 0 while unmeasured. */
	pxPerMs: number;
};

/**
 * Sample a storyboard against the current timeline scale: quantize the
 * density (with the densified floor its interval supports), pick the nested
 * start-anchored tile set, and pin the rendered widths to the track width.
 *
 * @param storyboard - The storyboard descriptor.
 * @param trackWidth - Rendered track width in px.
 * @param durationMs - Master duration in ms.
 * @return The sampled tiles and their rendered widths.
 */
function storyboardLayout(
	storyboard: Storyboard,
	trackWidth: number,
	durationMs: number
): StoryboardLayout {
	const cellW = cellWidth( storyboard.tile_width, storyboard.tile_height );
	const pxPerMs = trackWidth > 0 && durationMs > 0 ? trackWidth / durationMs : 0;
	const density = quantizeDensity(
		pxPerMs,
		storyboard.interval_ms,
		cellW,
		2 ** -subIntervalStops( storyboard.interval_ms )
	);
	const tiles = sampleTiles( storyboard.tiles, storyboard.interval_ms, density );
	const spanMs = density * storyboard.interval_ms;
	if ( trackWidth <= 0 || tiles.length === 0 ) {
		return { tiles, widths: null, spanMs, pxPerMs };
	}
	// Without a usable duration the scale is unknowable — and a degenerate
	// source interval (≤ 0: rejected by the API validation, guarded for
	// internal callers) would zero or invert the ideal width, collapsing
	// every tile but the last. Either way, fall back to an equal split so
	// the strip still fills the measured track.
	const pxPerSample =
		pxPerMs > 0 && storyboard.interval_ms > 0 ? spanMs * pxPerMs : trackWidth / tiles.length;
	return { tiles, widths: sampleWidths( tiles.length, pxPerSample, trackWidth ), spanMs, pxPerMs };
}

/**
 * Compare two time→URL maps entry by entry.
 *
 * @param a - One map.
 * @param b - The other map.
 * @return Whether they hold identical entries.
 */
function sameFrames( a: ReadonlyMap< number, string >, b: ReadonlyMap< number, string > ): boolean {
	if ( a.size !== b.size ) {
		return false;
	}
	for ( const [ ms, url ] of a ) {
		if ( b.get( ms ) !== url ) {
			return false;
		}
	}
	return true;
}

/**
 * Drive the extraction pool for a densified layout's off-grid tiles and
 * mirror the landed frames into state.
 *
 * Requests are visible-window only: on mount, on layout/scale change, and
 * on (throttled) scroll, the window is re-derived from the scroller and
 * handed to the pool, whose queue puts the newest request first — so
 * scrolling re-prioritizes extraction toward what is on screen. Settled
 * frames arrive via the pool's subscribe channel; cache hits are picked up
 * by the initial sync and render immediately. On cleanup (zoom step change,
 * unmount) the still-queued times are cancelled — the pool keeps its cache,
 * so returning to the stop is instant.
 *
 * @param pool       - The frame-extraction pool; null/undefined disables extraction.
 * @param scrollerEl - The timeline scroller; null/undefined disables requests.
 * @param layout     - The current storyboard layout; null outside storyboard mode.
 * @return Landed frames by tile time.
 */
function useExtractedFrames(
	pool: FrameExtractionPool | null | undefined,
	scrollerEl: HTMLElement | null | undefined,
	layout: StoryboardLayout | null
): ReadonlyMap< number, string > {
	const [ frames, setFrames ] = useState< ReadonlyMap< number, string > >( NO_FRAMES );

	const tiles = layout?.tiles;
	const offGridTimes = useMemo(
		() =>
			tiles?.some( tile => tile.spriteIndex === null )
				? tiles.filter( tile => tile.spriteIndex === null ).map( tile => tile.timeMs )
				: NO_TIMES,
		[ tiles ]
	);
	const spanMs = layout?.spanMs ?? 0;
	const pxPerMs = layout?.pxPerMs ?? 0;

	useEffect( () => {
		if ( ! pool || offGridTimes.length === 0 ) {
			setFrames( NO_FRAMES );
			return;
		}

		// Mirror every landed off-grid frame into state (only when something
		// actually changed — settle notifications arrive once per seek).
		const collect = () => {
			const next = new Map< number, string >();
			pool.peekFrames( offGridTimes ).forEach( ( slot, ms ) => {
				if ( slot.status === 'ready' ) {
					next.set( ms, slot.url );
				}
			} );
			setFrames( previous => ( sameFrames( previous, next ) ? previous : next ) );
		};

		const sync = () => {
			if ( scrollerEl ) {
				const windowTimes = visibleWindowTimes(
					offGridTimes,
					spanMs,
					scrollerEl.scrollLeft,
					scrollerEl.clientWidth,
					pxPerMs
				);
				if ( windowTimes.length > 0 ) {
					pool.requestFrames( windowTimes );
				}
			}
			collect();
		};

		const unsubscribe = pool.subscribe( collect );
		let throttle: ReturnType< typeof setTimeout > | null = null;
		const onScroll = () => {
			if ( throttle !== null ) {
				return;
			}
			throttle = setTimeout( () => {
				throttle = null;
				sync();
			}, SCROLL_SYNC_DELAY_MS );
		};
		scrollerEl?.addEventListener( 'scroll', onScroll, { passive: true } );
		sync();

		return () => {
			unsubscribe();
			scrollerEl?.removeEventListener( 'scroll', onScroll );
			if ( throttle !== null ) {
				clearTimeout( throttle );
			}
			// Stop seeking times this layout no longer shows. Settled frames
			// stay cached in the pool for the next visit to this stop.
			pool.cancelFrames( offGridTimes );
		};
	}, [ pool, scrollerEl, offGridTimes, spanMs, pxPerMs ] );

	return offGridTimes.length === 0 ? NO_FRAMES : frames;
}

/**
 * Sample a frames-mode strip against the current timeline scale (the
 * storyboard path generalized to index-only sources: extraction mode has no
 * sprite to densify, so the density floors at 1).
 *
 * @param sourceCount    - Total source frames.
 * @param baseIntervalMs - Time span of one source frame, in ms.
 * @param trackWidth     - Rendered track width in px.
 * @param durationMs     - Master duration in ms.
 * @return The sampled indices and their rendered widths.
 */
function frameLayout(
	sourceCount: number,
	baseIntervalMs: number,
	trackWidth: number,
	durationMs: number
): { indices: number[]; widths: number[] | null } {
	const pxPerMs = trackWidth > 0 && durationMs > 0 ? trackWidth / durationMs : 0;
	const density = quantizeDensity( pxPerMs, baseIntervalMs, cellWidth() );
	const indices = sampleIndices( sourceCount, density );
	if ( trackWidth <= 0 || indices.length === 0 ) {
		return { indices, widths: null };
	}
	// Same degenerate-interval guard as the storyboard path (symmetry only:
	// a frames-mode base interval is durationMs / frames.length, positive
	// whenever pxPerMs is).
	const pxPerSample =
		pxPerMs > 0 && baseIntervalMs > 0
			? density * baseIntervalMs * pxPerMs
			: trackWidth / indices.length;
	return { indices, widths: sampleWidths( indices.length, pxPerSample, trackWidth ) };
}

/**
 * The filmstrip track.
 *
 * @param props                - Component props.
 * @param props.filmstrip      - Filmstrip state from useFilmstrip.
 * @param props.trackWidth     - Rendered track width in px (the zoomed content width).
 * @param props.durationMs     - Master duration in ms.
 * @param props.extractionPool - Frame-extraction pool for densified tiles.
 * @param props.scrollerEl     - The timeline's horizontal scroller element.
 * @return The track element.
 */
export default function StudioEditorFilmstripTrack( {
	filmstrip,
	trackWidth = 0,
	durationMs = 0,
	extractionPool = null,
	scrollerEl = null,
}: Props ): ReactElement {
	const state: FilmstripState = filmstrip ?? { status: 'unavailable' };
	const storyboard = state.status === 'storyboard' ? state.storyboard : null;

	const layout = useMemo(
		() => ( storyboard ? storyboardLayout( storyboard, trackWidth, durationMs ) : null ),
		[ storyboard, trackWidth, durationMs ]
	);
	const extracted = useExtractedFrames( extractionPool, scrollerEl, layout );

	if ( storyboard && layout ) {
		const { tiles, widths } = layout;
		return (
			<div
				className="vp-studio-timeline__filmstrip"
				data-testid="studio-timeline-filmstrip"
				data-mode="storyboard"
				aria-hidden="true"
			>
				{ tiles.map( ( tile, position ) => {
					const width = widths?.[ position ];
					// Keys carry each tile's cross-density identity, so tiles
					// (and their loaded backgrounds/frames) stay in place when
					// the zoom steps: the sprite cell for on-grid tiles, the
					// start-anchored time (times nest across densities) for
					// off-grid ones. The prefixes keep the two key spaces
					// disjoint — and keep keys unique even when a degenerate
					// interval collapses every sampled time to 0.
					if ( tile.spriteIndex === null ) {
						const url = extracted.get( tile.timeMs );
						if ( url !== undefined ) {
							return (
								<img
									key={ `t${ tile.timeMs }` }
									className="vp-studio-timeline__filmstrip-tile"
									data-testid="studio-timeline-filmstrip-tile"
									data-time={ tile.timeMs }
									src={ url }
									style={ width === undefined ? undefined : { width: `${ width }px` } }
									alt=""
									draggable={ false }
								/>
							);
						}
						// Pending/off-window/failed: the dyadic parent sprite
						// tile stands in, cover-cropped like any other tile.
						return (
							<div
								key={ `t${ tile.timeMs }` }
								className="vp-studio-timeline__filmstrip-tile"
								data-testid="studio-timeline-filmstrip-tile"
								data-time={ tile.timeMs }
								data-placeholder-index={ tile.parentIndex }
								style={
									width === undefined
										? undefined
										: {
												width: `${ width }px`,
												...tileBackgroundStyle( storyboard, tile.parentIndex, width ),
										  }
								}
							/>
						);
					}
					return (
						<div
							key={ `s${ tile.spriteIndex }` }
							className="vp-studio-timeline__filmstrip-tile"
							data-testid="studio-timeline-filmstrip-tile"
							data-index={ tile.spriteIndex }
							style={
								width === undefined
									? undefined
									: {
											width: `${ width }px`,
											...tileBackgroundStyle( storyboard, tile.spriteIndex, width ),
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
		const { indices, widths } = frameLayout(
			frames.length,
			frames.length > 0 ? durationMs / frames.length : 0,
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
