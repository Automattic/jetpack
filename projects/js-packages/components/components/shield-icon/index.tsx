import React from 'react';

const COLORS = {
	error: '#D63638',
	warning: '#F0B849',
	success: '#069E08',
	default: '#1d2327',
};

/**
 * Protect Shield SVG Icon
 *
 * @param {object}  props           - Component props.
 * @param {string}  props.className - Additional class names.
 * @param {string}  props.contrast  - Icon contrast color. Overrides variant.
 * @param {string}  props.fill      - Icon fill color (default, success, warning, error, or a custom color code string). Overrides variant.
 * @param {number}  props.height    - Icon height (px). Width is calculated based on height.
 * @param {string}  props.icon      - Icon variant (success, error). Overrides variant.
 * @param {boolean} props.outline   - When enabled, the icon will use an outline style.
 * @param {string}  props.variant   - Icon variant (default, success, error).
 *
 * @return {React.ReactElement} Protect Shield SVG Icon
 */
export default function ShieldIcon( {
	className,
	contrast = '#fff',
	fill,
	height = 32,
	icon,
	outline = false,
	variant = 'default',
}: {
	className?: string;
	contrast?: string;
	fill?: 'default' | 'success' | 'warning' | 'error' | string;
	height?: number;
	icon?: 'success' | 'error';
	outline?: boolean;
	variant: 'default' | 'success' | 'warning' | 'error';
} ): JSX.Element {
	const shieldFill = COLORS[ fill ] || fill || COLORS[ variant ];
	const iconFill = outline ? shieldFill : contrast;
	const iconVariant = icon || variant;

	return (
		<svg
			height={ height }
			width={ ( height * 76 ) / 93 }
			viewBox="0 0 76 93"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={ className }
		>
			<path
				d={
					'M37.5652 0.980293L75.1304 18.0554V43.5097C75.1304 65.2086 61.1942 85.753 41.5427 92.2343C38.9604 93.0862 36.1701 93.0862 33.5878 92.2343C13.9362 85.753 0 65.2086 0 43.5097V18.0554L37.5652 0.980293Z' +
					( outline
						? ' M8.34783 23.4307V43.5097C8.34783 61.9471 20.286 79.0573 36.2024 84.3068C37.0866 84.5981 38.0438 84.5981 38.928 84.3068C54.8444 79.0573 66.7826 61.9471 66.7826 43.5097V23.4307L37.5652 10.15L8.34783 23.4307Z'
						: '' )
				}
				fill={ shieldFill }
			/>
			{ 'success' === iconVariant && (
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M55.6042 37.0675L34.3578 65.2656L20.898 55.3892L23.878 51.4342L33.33 58.3698L51.5965 34.1267L55.6042 37.0675Z"
					fill={ iconFill }
				/>
			) }
			{ [ 'warning', 'error' ].includes( iconVariant ) && (
				<path
					d="M41.7474 54.1614L43.0546 30H32L33.3071 54.1614H41.7474ZM41.4113 66.7283C42.3076 65.8681 42.7931 64.6713 42.7931 63.1378C42.7931 61.5669 42.345 60.3701 41.4487 59.5098C40.5523 58.6496 39.2452 58.2008 37.4899 58.2008C35.7346 58.2008 34.4275 58.6496 33.4939 59.5098C32.5602 60.3701 32.112 61.5669 32.112 63.1378C32.112 64.6713 32.5975 65.8681 33.5312 66.7283C34.5022 67.5886 35.8093 68 37.4899 68C39.1705 68 40.4776 67.5886 41.4113 66.7283Z"
					fill={ iconFill }
				/>
			) }
		</svg>
	);
}
