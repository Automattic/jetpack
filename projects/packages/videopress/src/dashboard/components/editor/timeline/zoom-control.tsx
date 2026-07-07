/**
 * Zoom control for the Studio editor timeline: a four-stop slider plus a
 * "Fit" button.
 *
 * The stops are geometrically spaced between two anchors — step 0 is fit
 * (the whole video in the viewport, zoom 1) and the last step is the
 * filmstrip's native tile density (`zoomMax`, see getFilmstripZoomMax) —
 * so `zoom(k) = zoomMax^(k / 3)`: each step multiplies the scale by the
 * same factor, matching zoom's multiplicative perception, and the slider
 * physically cannot reach zooms that would upscale tiles. Zoom itself
 * stays a continuous number owned by the timeline (the modifier+wheel path
 * produces in-between values, which the filmstrip's quantizer renders
 * correctly); this slider is only a discrete view of it — it displays the
 * nearest stop and reports whole-stop zoom factors. When the strip already
 * fits unstretched (zoomMax ≈ 1) the slider is disabled. The timeline owns
 * the keep-the-playhead-stationary scroll compensation.
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import type { ReactElement } from 'react';

/** Highest slider stop; the control offers SLIDER_STEPS + 1 zoom levels. */
const SLIDER_STEPS = 3;

/**
 * Caps at or below this leave no meaningful zoom range: the strip already
 * renders at (or above) its native tile density at fit, so the slider is
 * disabled rather than offering steps that barely change anything.
 */
const MIN_ZOOM_RANGE = 1.05;

/**
 * Map a zoom factor to its nearest slider stop.
 *
 * @param zoom    - Zoom factor in [1, zoomMax].
 * @param zoomMax - Maximum zoom factor (1 = no zoom range).
 * @return Slider stop in [0, SLIDER_STEPS].
 */
function zoomToStep( zoom: number, zoomMax: number ): number {
	if ( zoomMax <= 1 ) {
		// log(1) = 0: the mapping below would divide by zero.
		return 0;
	}
	const clamped = Math.min( zoomMax, Math.max( 1, zoom ) );
	const step = Math.round( ( SLIDER_STEPS * Math.log( clamped ) ) / Math.log( zoomMax ) );
	return Math.min( SLIDER_STEPS, Math.max( 0, step ) );
}

/**
 * Map a slider stop to its zoom factor.
 *
 * @param step    - Slider stop in [0, SLIDER_STEPS].
 * @param zoomMax - Maximum zoom factor (1 = no zoom range).
 * @return Zoom factor in [1, zoomMax].
 */
function stepToZoom( step: number, zoomMax: number ): number {
	if ( zoomMax <= 1 ) {
		return 1;
	}
	return zoomMax ** ( Math.min( SLIDER_STEPS, Math.max( 0, step ) ) / SLIDER_STEPS );
}

type Props = {
	/** Current zoom factor (1 = fit). */
	zoom: number;
	/** Maximum zoom factor (the filmstrip's native-density ceiling). */
	zoomMax: number;
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
 * @param props.zoomMax      - Maximum zoom factor.
 * @param props.onZoomChange - Called with the requested zoom factor.
 * @param props.onFit        - Called when "Fit" is pressed.
 * @return The zoom-control element.
 */
export default function StudioEditorZoomControl( {
	zoom,
	zoomMax,
	onZoomChange,
	onFit,
}: Props ): ReactElement {
	const step = zoomToStep( zoom, zoomMax );
	return (
		<div className="vp-studio-timeline__zoom">
			<input
				className="vp-studio-timeline__zoom-slider"
				type="range"
				min={ 0 }
				max={ SLIDER_STEPS }
				step={ 1 }
				disabled={ zoomMax <= MIN_ZOOM_RANGE }
				aria-label={ __( 'Timeline zoom', 'jetpack-videopress-pkg' ) }
				aria-valuetext={ sprintf(
					/* translators: 1: current zoom level (1 = fully zoomed out), 2: number of zoom levels. */
					__( 'Zoom level %1$d of %2$d', 'jetpack-videopress-pkg' ),
					step + 1,
					SLIDER_STEPS + 1
				) }
				value={ step }
				onChange={ event => onZoomChange( stepToZoom( Number( event.target.value ), zoomMax ) ) }
			/>
			<Button size="compact" variant="tertiary" onClick={ onFit }>
				{ __( 'Fit', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
}
