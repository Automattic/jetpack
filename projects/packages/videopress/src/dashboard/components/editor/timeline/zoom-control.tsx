/**
 * Zoom control for the Studio editor timeline: a slider plus a "Fit" button.
 *
 * The slider maps its 0–100 range onto zoom logarithmically (each equal slider
 * step multiplies the scale by the same factor), because zoom perception is
 * multiplicative — linear mapping would cram every useful low-zoom level into
 * the first few pixels of travel. The timeline owns the zoom value and the
 * keep-the-playhead-stationary scroll compensation; this control only reports
 * requested zoom factors.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { ReactElement } from 'react';

/**
 * Maximum timeline zoom factor (1 = the duration fits the viewport).
 */
export const MAX_ZOOM = 100;

const SLIDER_MAX = 100;

/**
 * Map a zoom factor to its (logarithmic) slider position.
 *
 * @param zoom - Zoom factor in [1, MAX_ZOOM].
 * @return Slider position in [0, SLIDER_MAX].
 */
function zoomToSlider( zoom: number ): number {
	const clamped = Math.min( MAX_ZOOM, Math.max( 1, zoom ) );
	return Math.round( ( SLIDER_MAX * Math.log( clamped ) ) / Math.log( MAX_ZOOM ) );
}

/**
 * Map a slider position back to a zoom factor.
 *
 * @param value - Slider position in [0, SLIDER_MAX].
 * @return Zoom factor in [1, MAX_ZOOM].
 */
function sliderToZoom( value: number ): number {
	return MAX_ZOOM ** ( Math.min( SLIDER_MAX, Math.max( 0, value ) ) / SLIDER_MAX );
}

type Props = {
	/** Current zoom factor (1 = fit). */
	zoom: number;
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
 * @param props.onZoomChange - Called with the requested zoom factor.
 * @param props.onFit        - Called when "Fit" is pressed.
 * @return The zoom-control element.
 */
export default function StudioEditorZoomControl( {
	zoom,
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
				aria-label={ __( 'Timeline zoom', 'jetpack-videopress-pkg' ) }
				value={ zoomToSlider( zoom ) }
				onChange={ event => onZoomChange( sliderToZoom( Number( event.target.value ) ) ) }
			/>
			<Button size="compact" variant="tertiary" onClick={ onFit }>
				{ __( 'Fit', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
}
