import { type JSX } from 'react';

/**
 * Protect Shield and Checkmark SVG Icon
 *
 * @param {object} props           - Component props.
 * @param {string} props.variant   - Icon variant.
 * @param {string} props.fill      - Icon fill color.
 * @param {string} props.className - Additional class names.
 * @param {number} props.height    - Icon height.
 * @return {JSX.Element} Protect Shield and Checkmark SVG Icon
 */
export default function ShieldIcon( {
	variant = 'default',
	height = 32,
	className,
	fill,
}: {
	variant:
		| 'default'
		| 'success'
		| 'error'
		| 'default-outline'
		| 'success-outline'
		| 'error-outline';
	className?: string;
	height?: number;
	fill?: string;
} ): JSX.Element {
	if ( 'error-outline' === variant ) {
		return (
			<svg
				height={ height }
				width={ ( height * 18 ) / 23 }
				viewBox="0 0 18 23"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={ className }
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9 0.234863L18 4.32577V10.4242C18 15.6229 14.6611 20.545 9.95293 22.0978C9.33425 22.3019 8.66575 22.3019 8.04707 22.0978C3.33888 20.545 0 15.6229 0 10.4242V4.32577L9 0.234863ZM2 5.6136V10.4242C2 14.8415 4.86018 18.9408 8.67349 20.1985C8.88533 20.2683 9.11467 20.2683 9.32651 20.1985C13.1398 18.9408 16 14.8415 16 10.4242V5.6136L9 2.43178L2 5.6136Z"
					fill={ fill || '#D63638' }
				/>
				<path
					d="M8.22887 12.9258H9.78763L9.93608 7H8.08041L8.22887 12.9258ZM9.00825 16C9.57113 16 10.0165 15.5732 10.0165 15.0289C10.0165 14.4845 9.57113 14.0577 9.00825 14.0577C8.44536 14.0577 8 14.4845 8 15.0289C8 15.5732 8.44536 16 9.00825 16Z"
					fill={ fill || '#D63638' }
				/>
			</svg>
		);
	}

	if ( 'error' === variant ) {
		return (
			<svg
				height={ height }
				width={ ( height * 123 ) / 150 }
				viewBox="0 0 123 150"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={ className }
			>
				<path
					d="M61.364 0L0 27.273v40.909C0 106.023 26.182 141.409 61.364 150c35.182-8.591 61.363-43.977 61.363-81.818v-40.91L61.364 0z"
					fill={ fill || '#D63638' }
				/>
				<path
					d="M54.486 40.97h13.755v40.826H54.485V40.97zM54.486 95.55h13.755v13.48H54.485V95.55z"
					fill={ `#fff` }
				/>
			</svg>
		);
	}

	if ( 'success-outline' === variant ) {
		return (
			<svg
				height={ height }
				width={ ( height * 14 ) / 17 }
				viewBox="0 0 14 17"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={ className }
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M7 0.17627L13.75 3.24445V7.8183C13.75 11.7173 11.2458 15.4089 7.7147 16.5735C7.2507 16.7265 6.7493 16.7265 6.2853 16.5735C2.75416 15.4089 0.25 11.7173 0.25 7.8183V3.24445L7 0.17627ZM1.75 4.21032V7.8183C1.75 11.1312 3.89514 14.2057 6.7551 15.149C6.914 15.2014 7.086 15.2014 7.2449 15.149C10.1049 14.2057 12.25 11.1312 12.25 7.8183V4.21032L7 1.82396L1.75 4.21032Z"
					fill={ fill || '#069E08' }
				/>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M10.5291 7.0315L6.1818 11.358L3.47095 8.66L4.52907 7.5968L6.1818 9.2417L9.4709 5.96826L10.5291 7.0315Z"
					fill={ fill || '#069E08' }
				/>
			</svg>
		);
	}

	if ( 'success' === variant ) {
		return (
			<svg
				height={ height }
				width={ ( height * 80 ) / 96 }
				viewBox="0 0 80 96"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={ className }
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M40 0.00634766L80 17.7891V44.2985C80 66.8965 65.1605 88.2927 44.2352 95.0425C41.4856 95.9295 38.5144 95.9295 35.7648 95.0425C14.8395 88.2927 0 66.8965 0 44.2985V17.7891L40 0.00634766Z"
					fill={ fill || '#069E08' }
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

	if ( 'default-outline' === variant ) {
		return (
			<svg
				height={ height }
				width={ ( height * 18 ) / 23 }
				viewBox="0 0 18 23"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				className={ className }
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M9 0.234863L18 4.32577V10.4242C18 15.6229 14.6611 20.545 9.95293 22.0978C9.33425 22.3019 8.66575 22.3019 8.04707 22.0978C3.33888 20.545 0 15.6229 0 10.4242V4.32577L9 0.234863ZM2 5.6136V10.4242C2 14.8415 4.86018 18.9408 8.67349 20.1985C8.88533 20.2683 9.11467 20.2683 9.32651 20.1985C13.1398 18.9408 16 14.8415 16 10.4242V5.6136L9 2.43178L2 5.6136Z"
					fill={ fill || 'black' }
				/>
			</svg>
		);
	}

	return (
		<svg
			height={ height }
			width={ ( height * 80 ) / 96 }
			viewBox="0 0 80 96"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={ className }
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M40 0.00634766L80 17.7891V44.2985C80 66.8965 65.1605 88.2927 44.2352 95.0425C41.4856 95.9295 38.5144 95.9295 35.7648 95.0425C14.8395 88.2927 0 66.8965 0 44.2985V17.7891L40 0.00634766Z"
				fill={ fill || 'black' }
			/>
		</svg>
	);
}
