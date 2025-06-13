import { __ } from '@wordpress/i18n';
import { SVG, G, Rect, Path, SVGProps } from '@wordpress/primitives';

const CreativeMailIcon = ( props: SVGProps & { width?: number; height?: number } ) => (
	<SVG
		{ ...props }
		width={ props.width || 30 }
		height={ props.height || 30 }
		viewBox="0 0 258 258"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label={ __( 'Creative Mail icon', 'jetpack-forms' ) }
	>
		<G clipPath="url(#clip0)">
			<Rect width="258" height="258" fill="#F2EFF8" />
			<Path
				d="M473.616 242.393C286.085 103.281 -48.1297 232.191 -99.1903 253.521L-170.675 265.578L-322 187.675L-273.725 -72L572.952 -57.1614C602.351 89.0605 623.642 353.682 473.616 242.393Z"
				fill="white"
			/>
			<Path
				d="M516.537 189.11C348.782 86.6334 -48.2135 155.075 -225.742 202.105L-261 -94L540.661 -79.1483C602.517 52.9696 684.292 291.586 516.537 189.11Z"
				fill="#7A5CBD"
			/>
			<Path d="M57.1335 113.123L84.543 172.621L249 113.123H57.1335Z" fill="#663399" />
			<Path d="M49.1116 121.813L83.2063 172.621L249 113.123L49.1116 121.813Z" fill="#F68909" />
			<Path d="M49.1114 121.813L9 179.975L249 113.123L49.1114 121.813Z" fill="#FFD66D" />
			<Path d="M57.1335 113.123L86.5486 73.0112L249 113.123H57.1335Z" fill="#D1B3EE" />
		</G>
		<defs>
			<clipPath id="clip0">
				<Rect width="258" height="258" fill="white" />
			</clipPath>
		</defs>
	</SVG>
);

export default CreativeMailIcon;
