/**
 * External dependencies
 */
import { Path, SVG, SVGProps } from '@wordpress/primitives';

const NotificationsSVG = ( props: SVGProps ) => {
	return (
		<SVG
			width="46"
			height="36"
			viewBox="0 0 46 36"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			{ ...props }
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M4.6667 8C2.0894 8 0 10.0893 0 12.6667V31.3333C0 33.9107 2.0894 36 4.6667 36H32.6667C35.244 36 37.3334 33.9107 37.3334 31.3333V12.6667C37.3334 10.0893 35.244 8 32.6667 8H4.6667ZM3.5 13.6382V31.3333C3.5 31.9777 4.0224 32.5 4.6667 32.5H32.6667C33.311 32.5 33.8334 31.9777 33.8334 31.3333V13.6382L18.6667 26.6382L3.5 13.6382ZM30.9499 11.5H6.3835L18.6667 22.0284L30.9499 11.5Z"
				fill="#1E1E1E"
			/>
			<Path
				d="M37.668 16C42.0862 16 45.668 12.4183 45.668 8C45.668 3.58172 42.0862 0 37.668 0C33.2497 0 29.668 3.58172 29.668 8C29.668 12.4183 33.2497 16 37.668 16Z"
				fill="#D63638"
			/>
		</SVG>
	);
};

export default NotificationsSVG;
