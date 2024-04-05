import { Path, SVG } from '@wordpress/components';
import React from 'react';

/**
 * Close icon component
 *
 * @param {object} props        - Component props
 * @param {string} props.color  - Color code for the icon
 * @returns {React.ReactElement} Component template
 */
export default function CloseIcon( { color = '#D63638' } ) {
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
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 13.0607L15.7123 16.773L16.773 15.7123L13.0607 12L16.773 8.28772L15.7123 7.22706L12 10.9394L8.28771 7.22705L7.22705 8.28771L10.9394 12L7.22706 15.7123L8.28772 16.773L12 13.0607Z"
				fill={ color }
			/>
		</SVG>
	);
}
