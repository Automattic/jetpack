import { useState } from 'react';
import type { FilmstripState } from '../../../hooks/use-filmstrip';
import type { Storyboard } from '../../../types/edits';
import type { CSSProperties, ReactElement } from 'react';

type Props = {
	filmstrip?: FilmstripState;
	trackWidth: number;
	durationMs: number;
};

/**
 * Cover a timeline tile using the sprite cell for its original timestamp.
 *
 * @param storyboard - Original-video sprite descriptor.
 * @param timeMs     - Original-video timestamp.
 * @param width      - Displayed tile width in pixels.
 * @return The sprite crop styles.
 */
export function tileStyle( storyboard: Storyboard, timeMs: number, width: number ): CSSProperties {
	const index = Math.min( storyboard.tiles - 1, Math.floor( timeMs / storyboard.interval_ms ) );
	const scale = Math.max( width / storyboard.tile_width, 64 / storyboard.tile_height );
	const tileWidth = storyboard.tile_width * scale;
	const tileHeight = storyboard.tile_height * scale;
	return {
		inlineSize: width,
		backgroundImage: `url(${ JSON.stringify( storyboard.url ) })`,
		backgroundSize: `${ storyboard.columns * tileWidth }px ${ ( storyboard.rows ?? Math.ceil( storyboard.tiles / storyboard.columns ) ) * tileHeight }px`,
		backgroundPosition: `${ -( index % storyboard.columns ) * tileWidth - ( tileWidth - width ) / 2 }px ${ -Math.floor( index / storyboard.columns ) * tileHeight - ( tileHeight - 64 ) / 2 }px`,
	};
}

/**
 * Render a bounded number of storyboard samples at the timeline's scale.
 *
 * @param props            - Track props.
 * @param props.filmstrip  - Original-video storyboard.
 * @param props.trackWidth - Width shared by the ruler and edit overlay.
 * @param props.durationMs - Original-video duration.
 * @return The decorative track.
 */
export default function FilmstripTrack( {
	filmstrip,
	trackWidth,
	durationMs,
}: Props ): ReactElement {
	const [ failedUrl, setFailedUrl ] = useState< string | null >( null );
	const storyboard = filmstrip?.status === 'storyboard' ? filmstrip.storyboard : null;
	if ( ! storyboard || storyboard.url === failedUrl || trackWidth <= 0 || durationMs <= 0 ) {
		return <div className="vp-studio-timeline__filmstrip-placeholder" aria-hidden="true" />;
	}
	const tileWidth = ( 64 * storyboard.tile_width ) / storyboard.tile_height;
	const count = Math.min( 1000, Math.max( 1, Math.ceil( trackWidth / tileWidth ) ) );
	const width = trackWidth / count;
	return (
		<div className="vp-studio-timeline__filmstrip" aria-hidden="true">
			<img
				className="vp-studio-timeline__sprite-probe"
				src={ storyboard.url }
				onError={ () => setFailedUrl( storyboard.url ) }
				alt=""
			/>
			{ Array.from( { length: count }, ( _, index ) => (
				<div
					key={ index }
					className="vp-studio-timeline__filmstrip-tile"
					style={ tileStyle( storyboard, ( ( index + 0.5 ) / count ) * durationMs, width ) }
				/>
			) ) }
		</div>
	);
}
