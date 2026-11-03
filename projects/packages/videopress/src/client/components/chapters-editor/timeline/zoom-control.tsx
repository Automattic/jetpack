/**
 * Zoom control for the chapters editor timeline: a discrete-stop slider plus
 * a "Fit" button.
 *
 * The stops come from the strip's {@link ZoomLadder}: geometrically spaced
 * between two anchors — step 0 is fit (the whole video in the viewport,
 * zoom 1) and step BASE_ZOOM_STEPS is the strip's native tile density
 * (`sourceZoom`, see getFilmstripZoomLadder) — then one doubling stop per
 * densified (interval-halving) level past it, so the slider physically
 * cannot reach zooms the ladder can't render without upscaling. Zoom itself
 * stays a continuous number owned by the timeline (the modifier+wheel path
 * produces in-between values); this slider is only a discrete view of it —
 * it displays the nearest stop and reports whole-stop zoom factors. When the
 * strip already fits unstretched (ceiling ≈ 1) the slider is disabled. The
 * timeline owns the keep-the-playhead-stationary scroll compensation.
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	ladderMaxZoom,
	ladderStepCount,
	ladderStepForZoom,
	ladderZoomForStep,
} from './zoom-ladder';
import type { ZoomLadder } from './zoom-ladder';
import type { ReactElement } from 'react';

/**
 * Caps at or below this leave no meaningful zoom range: the strip already
 * renders at (or above) its native tile density at fit, so the slider is
 * disabled rather than offering steps that barely change anything.
 */
const MIN_ZOOM_RANGE = 1.05;

type Props = {
	/** Current zoom factor (1 = fit). */
	zoom: number;
	/** The strip's zoom ladder (anchor + densified stop count). */
	ladder: ZoomLadder;
	/** Called with the requested zoom factor. */
	onZoomChange: ( zoom: number ) => void;
	/** Called when the user asks to fit the whole duration in the viewport. */
	onFit: () => void;
};

/**
 * The timeline's zoom slider and fit button.
 *
 * @param props              - Component props.
 * @param props.zoom         - Current zoom factor.
 * @param props.ladder       - The strip's zoom ladder.
 * @param props.onZoomChange - Called with the requested zoom factor.
 * @param props.onFit        - Called when "Fit" is pressed.
 * @return The zoom-control element.
 */
export default function ZoomControl( { zoom, ladder, onZoomChange, onFit }: Props ): ReactElement {
	const steps = ladderStepCount( ladder );
	const step = ladderStepForZoom( zoom, ladder );
	return (
		<div className="vp-chapters-timeline__zoom">
			<Button size="compact" variant="tertiary" onClick={ onFit }>
				{ __( 'Fit', 'jetpack-videopress-pkg' ) }
			</Button>
			<input
				className="vp-chapters-timeline__zoom-slider"
				type="range"
				min={ 0 }
				max={ steps }
				step={ 1 }
				disabled={ ladderMaxZoom( ladder ) <= MIN_ZOOM_RANGE }
				aria-label={ __( 'Timeline zoom', 'jetpack-videopress-pkg' ) }
				aria-valuetext={ sprintf(
					/* translators: 1: current zoom level (1 = fully zoomed out), 2: number of zoom levels. */
					__( 'Zoom level %1$d of %2$d', 'jetpack-videopress-pkg' ),
					step + 1,
					steps + 1
				) }
				value={ step }
				onChange={ event =>
					onZoomChange( ladderZoomForStep( Number( event.target.value ), ladder ) )
				}
			/>
		</div>
	);
}
