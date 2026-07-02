/**
 * Filmstrip track for the Studio editor timeline.
 *
 * Renders per filmstrip mode: storyboard shows equal-width tiles cut from
 * the server sprite via percentage-based background positioning, so tiles
 * stretch under zoom with no per-tile pixel math or re-measuring; frames
 * shows one <img> per client-extracted frame (object URLs), stretched by the
 * same flex layout — no re-extraction on zoom in v1; loading, unavailable,
 * and an absent prop all keep the neutral gradient placeholder.
 *
 * Purely presentational and decorative (aria-hidden). Pointer events bubble
 * to the timeline content's scrub surface, exactly like the placeholder the
 * track replaces.
 */
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../types/edits';
import type { CSSProperties, ReactElement } from 'react';

type Props = {
	/** Filmstrip state from useFilmstrip; absent renders the placeholder. */
	filmstrip?: FilmstripState;
};

/**
 * Compute one storyboard tile's background style.
 *
 * Percentage background-position maps 0–100% onto the sprite's overflow
 * (sheet size minus element size), so with the sheet scaled to
 * `columns × rows` element sizes, `column / (columns - 1) * 100%` shows
 * exactly that tile at any rendered size — which is what lets tiles stretch
 * under zoom for free.
 *
 * @param storyboard - The storyboard descriptor.
 * @param index      - Tile index (row-major within the sprite).
 * @return The tile's CSS properties.
 */
function storyboardTileStyle( storyboard: Storyboard, index: number ): CSSProperties {
	const rows = Math.max( 1, Math.ceil( storyboard.tiles / storyboard.columns ) );
	const column = index % storyboard.columns;
	const row = Math.floor( index / storyboard.columns );
	const x = storyboard.columns > 1 ? ( column / ( storyboard.columns - 1 ) ) * 100 : 0;
	const y = rows > 1 ? ( row / ( rows - 1 ) ) * 100 : 0;
	return {
		// Quoted, so URLs containing CSS-significant characters stay intact.
		backgroundImage: `url("${ storyboard.url }")`,
		backgroundSize: `${ storyboard.columns * 100 }% ${ rows * 100 }%`,
		backgroundPosition: `${ x }% ${ y }%`,
	};
}

/**
 * The filmstrip track.
 *
 * @param props           - Component props.
 * @param props.filmstrip - Filmstrip state from useFilmstrip.
 * @return The track element.
 */
export default function StudioEditorFilmstripTrack( { filmstrip }: Props ): ReactElement {
	const state: FilmstripState = filmstrip ?? { status: 'unavailable' };

	if ( state.status === 'storyboard' ) {
		const { storyboard } = state;
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
						style={ storyboardTileStyle( storyboard, index ) }
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
