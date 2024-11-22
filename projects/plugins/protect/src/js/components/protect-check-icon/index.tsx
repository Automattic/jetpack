import { type JSX } from 'react';

/**
 * Protect Shield and Checkmark SVG Icon
 *
 * @param {object} props               - Component props.
 * @param {string} [props.width="80"]  - The width of the SVG Icon.
 * @param {string} [props.height="96"] - The height of the SVG Icon.
 * @param {string} [props.status=null] - The status of the icon.
 *
 * @return {JSX.Element} Protect Shield and Checkmark SVG Icon
 */
export default function ProtectCheck( {
	width = '80',
	height = '96',
	status = null,
} ): JSX.Element {
	let fill = '#069E08';

	if ( status === 'warning' ) {
		fill = '#F0B849';
	} else if ( status === 'disabled' ) {
		fill = '#A7AAAD';
	}

	return (
		<svg
			width={ width }
			height={ height }
			viewBox="0 0 80 96"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M40 0.00634766L80 17.7891V44.2985C80 66.8965 65.1605 88.2927 44.2352 95.0425C41.4856 95.9295 38.5144 95.9295 35.7648 95.0425C14.8395 88.2927 0 66.8965 0 44.2985V17.7891L40 0.00634766Z"
				fill={ fill }
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M60.9 33.6909L35.375 67.9124L19.2047 55.9263L22.7848 51.1264L34.1403 59.5436L56.0851 30.122L60.9 33.6909Z"
				fill="white"
			/>
		</svg>
	);
}
