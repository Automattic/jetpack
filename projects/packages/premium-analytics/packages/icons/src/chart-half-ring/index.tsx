/**
 * External dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

/**
 * A semi-circle chart, as a 24px control glyph on the `chartBar` grid, to pair with it in a control.
 */
export const chartHalfRing = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<Path
			d="M5.5 16.5A6.5 6.5 0 0 1 12.81 10.05M14.77 10.62A6.5 6.5 0 0 1 18.5 16.5"
			stroke="currentColor"
			strokeWidth="3"
		/>
	</SVG>
);
