import { Path, SVG, Rect } from '@wordpress/components';
import React from 'react';

/**
 * Checkmark Circle icon component
 *
 * @param {object} props        - Component props
 * @param {string} props.color  - Color code for the checkmark
 * @returns {React.ReactElement} Component template
 */
export default function CheckCircleIcon( { color = '#008A20' } ) {
	return (
		<SVG
			clipRule="evenodd"
			fillRule="evenodd"
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Rect width="20" height="20" rx="10" fill={ color } />
			<Path d="M15.2011 5.49999L8.52564 14.4777L4.65482 11.5996" stroke="white" strokeWidth="1.5" />
		</SVG>
	);
}
