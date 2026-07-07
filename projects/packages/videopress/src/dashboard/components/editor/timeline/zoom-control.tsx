/**
 * Zoom control for the Studio editor timeline: a slider plus a "Fit" button.
 *
 * The slider maps its 0–100 range onto [1, zoomMax] logarithmically (each
 * equal slider step multiplies the scale by the same factor), because zoom
 * perception is multiplicative — linear mapping would cram every useful
 * low-zoom level into the first few pixels of travel. The ceiling comes
 * from the filmstrip's native tile density (see getFilmstripZoomMax), so
 * the slider physically cannot reach zooms that would upscale tiles; when
 * the strip already fits unstretched (zoomMax ≈ 1) the slider is disabled.
 * The timeline owns the zoom value and the keep-the-playhead-stationary
 * scroll compensation; this control only reports requested zoom factors.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { ReactElement } from 'react';

const SLIDER_MAX = 100;

/**
 * Caps at or below this leave no meaningful zoom range: the strip already
 * renders at (or above) its native tile density at fit, so the slider is
 * disabled rather than offering a hair's width of travel.
 */
const MIN_ZOOM_RANGE = 1.05;

/**
 * Map a zoom factor to its (logarithmic) slider position.
 *
 * @param zoom    - Zoom factor in [1, zoomMax].
 * @param zoomMax - Maximum zoom factor (1 = no zoom range).
 * @return Slider position in [0, SLIDER_MAX].
 */
function zoomToSlider( zoom: number, zoomMax: number ): number {
	if ( zoomMax <= 1 ) {
		// log(1) = 0: the mapping below would divide by zero.
		return 0;
	}
	const clamped = Math.min( zoomMax, Math.max( 1, zoom ) );
	return Math.round( ( SLIDER_MAX * Math.log( clamped ) ) / Math.log( zoomMax ) );
}

/**
 * Map a slider position back to a zoom factor.
 *
 * @param value   - Slider position in [0, SLIDER_MAX].
 * @param zoomMax - Maximum zoom factor (1 = no zoom range).
 * @return Zoom factor in [1, zoomMax].
 */
function sliderToZoom( value: number, zoomMax: number ): number {
	if ( zoomMax <= 1 ) {
		return 1;
	}
	return zoomMax ** ( Math.min( SLIDER_MAX, Math.max( 0, value ) ) / SLIDER_MAX );
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
	return (
		<div className="vp-studio-timeline__zoom">
			<input
				className="vp-studio-timeline__zoom-slider"
				type="range"
				min={ 0 }
				max={ SLIDER_MAX }
				step={ 1 }
				disabled={ zoomMax <= MIN_ZOOM_RANGE }
				aria-label={ __( 'Timeline zoom', 'jetpack-videopress-pkg' ) }
				value={ zoomToSlider( zoom, zoomMax ) }
				onChange={ event => onZoomChange( sliderToZoom( Number( event.target.value ), zoomMax ) ) }
			/>
			<Button size="compact" variant="tertiary" onClick={ onFit }>
				{ __( 'Fit', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
}
