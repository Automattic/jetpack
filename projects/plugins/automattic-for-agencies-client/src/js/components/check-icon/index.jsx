import { Path, SVG } from '@wordpress/components';
import React from 'react';

/**
 * Checkmark icon component
 *
 * @param {object} props        - Component props
 * @param {string} props.color  - Color code for the checkmark
 * @returns {React.ReactElement} Component template
 */
export default function CheckIcon( { color = '#029CD7' } ) {
	return (
		<SVG
			clipRule="evenodd"
			fillRule="evenodd"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				d="M18.9348 5.99991L10.0342 17.9702L4.8731 14.1327"
				stroke={ color }
				strokeWidth="1.5"
			/>
		</SVG>
	);
}
