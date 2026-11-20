/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * A determinate twin of the 16px Spinner: same track and accent colours, with the arc filling clockwise.
 *
 * @param {object} props       - Component props.
 * @param {number} props.value - Percentage complete, 0 to 100.
 * @return {JSX.Element} The ring.
 */
const ProgressRing = ( { value }: { value: number } ) => (
	<svg
		className="jp-forms__export-progress-ring"
		width="16"
		height="16"
		viewBox="0 0 16 16"
		role="progressbar"
		aria-label={ __( 'Download progress', 'jetpack-forms' ) }
		aria-valuemin={ 0 }
		aria-valuemax={ 100 }
		aria-valuenow={ value }
	>
		<circle className="jp-forms__export-progress-ring-track" cx="8" cy="8" r="8" />
		{ /* pathLength makes the dash length the percentage itself. */ }
		<circle
			className="jp-forms__export-progress-ring-indicator"
			cx="8"
			cy="8"
			r="8"
			pathLength={ 100 }
			strokeDasharray={ `${ value } 100` }
		/>
	</svg>
);

export default ProgressRing;
