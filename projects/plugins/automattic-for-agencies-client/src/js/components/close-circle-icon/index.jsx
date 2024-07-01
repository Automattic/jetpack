import { Path, Rect, SVG } from '@wordpress/components';
import React from 'react';

/**
 * Close circle icon component
 *
 * @param {object} props        - Component props
 * @param {string} props.color  - Color code for the icon
 * @returns {React.ReactElement} Component template
 */
export default function CloseCircleIcon( { color = '#D63638' } ) {
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
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M9.9999 10.7956L12.7841 13.5799L13.5796 12.7844L10.7954 10.0001L13.5796 7.21591L12.7841 6.42042L9.9999 9.20465L7.21566 6.42041L6.42017 7.21591L9.20441 10.0001L6.42017 12.7844L7.21567 13.5799L9.9999 10.7956Z"
				fill="white"
			/>
		</SVG>
	);
}
