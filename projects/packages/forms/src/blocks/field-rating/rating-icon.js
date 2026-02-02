import { SVG, Path } from '@wordpress/components';
import { RATING_ICONS } from './rating-icons.js';

/**
 * Rating icon React component for use in the block editor and dashboard.
 *
 * @param {object} props             - Component props.
 * @param {string} props.iconStyle   - The icon style ('stars' or 'hearts').
 * @param {string} props.strokeColor - SVG stroke color.
 * @param {string} props.fillColor   - SVG fill color.
 * @return {import('react').JSX.Element} SVG icon element.
 */
export const RatingIcon = ( { iconStyle, strokeColor = 'currentColor', fillColor = 'none' } ) => {
	const iconPath = RATING_ICONS[ iconStyle ] || RATING_ICONS.stars;
	return (
		<SVG className="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true">
			<Path
				d={ iconPath }
				fill={ fillColor }
				stroke={ strokeColor }
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</SVG>
	);
};
