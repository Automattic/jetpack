import { SVG, Line, Circle } from '@wordpress/components';

/**
 * RangeIcon - A horizontal line with a dot in the middle, for use as a range field icon.
 *
 * @param {object} props - React props
 * @return {Element} The SVG icon
 */
export default function RangeIcon( props ) {
	return (
		<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" { ...props }>
			<Line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
			<Circle cx="12" cy="12" r="2" fill="currentColor" />
		</SVG>
	);
}
