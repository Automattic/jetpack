/**
 * External dependencies
 */
import { Defs, LinearGradient, Rect, SVG, SVGProps, Stop } from '@wordpress/primitives';

const ExportSVG = ( props: SVGProps ) => {
	return (
		<SVG
			width="132"
			height="50"
			viewBox="0 0 132 50"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			{ ...props }
		>
			<Rect x="25" y="14" width="107" height="4" rx="2" fill="#256EFF" />
			<Rect x="31" y="35" width="63" height="3" rx="1.5" fill="#1858D8" />
			<Rect x="16" y="35" width="8" height="3" rx="1.5" fill="#1858D8" />
			<Rect y="14" width="19" height="4" rx="2" fill="#256EFF" />
			<Rect x="44" y="25" width="72" height="4" rx="2" fill="#357B49" />
			<Rect x="16" y="25" width="23" height="4" rx="2" fill="#357B49" />
			<Rect x="6" y="5" width="66" height="3" rx="1.5" fill="#6DBF85" />
			<Rect width="127" height="50" fill="url(#paint0_linear_3308_44308)" />
			<Defs>
				<LinearGradient
					id="paint0_linear_3308_44308"
					x1="2.5"
					y1="25"
					x2="65.5"
					y2="25"
					gradientUnits="userSpaceOnUse"
				>
					<Stop stopColor="white" />
					<Stop offset="1" stopColor="white" stopOpacity="0" />
				</LinearGradient>
			</Defs>
		</SVG>
	);
};

export default ExportSVG;
