/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/components';
import React from 'react';

const aiAssistant = (
	<SVG
		viewBox="0 0 32 32"
		width="32"
		height="32"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
		className="ai-assistant-icon"
	>
		<Path
			className="spark-first"
			d="M9.33301 5.33325L10.4644 8.20188L13.333 9.33325L10.4644 10.4646L9.33301 13.3333L8.20164 10.4646L5.33301 9.33325L8.20164 8.20188L9.33301 5.33325Z"
		/>
		<Path
			className="spark-second"
			d="M21.3333 5.33333L22.8418 9.15817L26.6667 10.6667L22.8418 12.1752L21.3333 16L19.8248 12.1752L16 10.6667L19.8248 9.15817L21.3333 5.33333Z"
		/>
		<Path
			className="spark-third"
			d="M14.6667 13.3333L16.5523 18.1144L21.3333 20L16.5523 21.8856L14.6667 26.6667L12.781 21.8856L8 20L12.781 18.1144L14.6667 13.3333Z"
		/>
	</SVG>
);

export default aiAssistant;
