/**
 * External dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

/**
 * A line chart, as a 24px control glyph. Drawn on the same grid as `chartBar`
 * from `@wordpress/icons`, at the stroke weight of that icon's bars, so the
 * two read as one pair when they sit side by side in a control.
 */
export const chartLine = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<Path
			d="M5.5 15.75L10 10.25L14 13.75L18.5 7.25"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</SVG>
);
