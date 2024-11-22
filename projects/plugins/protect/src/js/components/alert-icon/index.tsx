import React from 'react';

/**
 * Alert icon
 *
 * @param {object} props           - Props.
 * @param {string} props.className - Optional component class name.
 * @param {string} props.width     - Optional icon width. Defaults to '127'.
 * @param {string} props.height    - Optional icon height. Defaults to '136'.
 * @param {string} props.color     - Optional icon color. Defaults to '#D63638'.
 *
 * @return {JSX.Element}      The Alert Icon component.
 */
export default function Alert( {
	className,
	width = '40',
	height = '48',
	color = '#D63638',
}: {
	className?: string;
	width?: string;
	height?: string;
	color?: string;
} ): JSX.Element {
	return (
		<svg
			className={ className }
			width={ width }
			height={ height }
			viewBox="0 0 40 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20 0L40 8.91914V22.2152C40 33.5494 32.5803 44.2809 22.1176 47.6664C20.7428 48.1112 19.2572 48.1112 17.8824 47.6664C7.41973 44.2809 0 33.5494 0 22.2152V8.91914L20 0Z"
				fill={ color }
			/>
			<rect x="17" y="31" width="6" height="6" rx="3" fill="white" />
			<path
				d="M17.0664 13.0624C17.0304 12.4867 17.4876 12 18.0645 12H21.9355C22.5124 12 22.9696 12.4867 22.9336 13.0624L22.0586 27.0624C22.0257 27.5894 21.5886 28 21.0605 28H18.9395C18.4114 28 17.9743 27.5894 17.9414 27.0624L17.0664 13.0624Z"
				fill="white"
			/>
		</svg>
	);
}
