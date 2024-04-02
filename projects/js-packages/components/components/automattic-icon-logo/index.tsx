import { Path, SVG } from '@wordpress/components';
import React from 'react';

/**
 * Automattic Icon Logo component
 *
 * @param {object} props             - Component props
 * @param {string} props.innerColor  - Color code for the line in the middle of the logo.
 * @param {string} props.outerColor  - Color code for the logo's outer
 * @returns {React.ReactElement} Component template
 */
export default function AutomatticIconLogo( {
	innerColor = '#00A3E0',
	outerColor = '#FFFFFF',
}: {
	innerColor: string;
	outerColor: string;
} ): React.ReactElement {
	return (
		<SVG
			clipRule="evenodd"
			fill="none"
			fillRule="evenodd"
			height="43"
			viewBox="0 0 47 43"
			width="47"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M39.3164 20.9589C39.3164 13.2129 33.656 6.30469 23.4214 6.30469C13.1867 6.30469 7.58624 13.2129 7.58624 20.9589V21.9206C7.58624 29.6677 13.1867 36.6942 23.4214 36.6942C33.656 36.6942 39.3164 29.6677 39.3164 21.9206V20.9589ZM23.4214 43C9.21187 43 0 32.7913 0 22.1604V20.8407C0 10.0285 9.21187 0 23.4214 0C37.6919 0 46.9038 10.0285 46.9038 20.8407V22.1604C46.9038 32.7913 37.6919 43 23.4214 43Z"
				fill={ innerColor }
			/>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M28.4548 14.1897C29.752 15.0401 30.1158 16.8077 29.2739 18.1343L22.712 28.4682C21.8691 29.7959 20.1348 30.1799 18.8397 29.3295C17.5446 28.477 17.1765 26.7137 18.0205 25.386L24.5824 15.0522C25.4253 13.7256 27.1597 13.3404 28.4548 14.1897Z"
				fill={ outerColor }
			/>
		</SVG>
	);
}
