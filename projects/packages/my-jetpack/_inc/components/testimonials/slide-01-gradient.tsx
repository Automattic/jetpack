import { useId } from 'react';

type Slide01GradientProps = {
	className?: string;
	// The wizard's panel stretches the artwork to a band, so it passes "none".
	preserveAspectRatio?: string;
};

/**
 * Gradient for the first slide of the testimonials section, and for the onboarding
 * wizard's brand panel.
 *
 * Defs ids are scoped with useId(): both surfaces can mount at once, and duplicate
 * filter and gradient ids resolve to whichever landed in the document first.
 *
 * @param props                     - The component props.
 * @param props.className           - The class the caller styles the SVG with.
 * @param props.preserveAspectRatio - The SVG aspect-ratio behaviour.
 * @return The SVG element representing the gradient.
 */
export function Slide01Gradient( {
	className = 'jp-gradient',
	preserveAspectRatio,
}: Slide01GradientProps = {} ) {
	const uid = useId().replace( /:/g, '' );
	const blur = `jp-gradient-blur-${ uid }`;
	const grad = `jp-gradient-stops-${ uid }`;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="672"
			height="521"
			viewBox="0 0 672 521"
			fill="none"
			preserveAspectRatio={ preserveAspectRatio }
			className={ className }
			role="presentation"
		>
			<g filter={ `url(#${ blur })` }>
				<path
					d="M763.172 -127.994C763.172 107.34 572.395 298.117 337.061 298.117C101.726 298.117 -89.0503 107.34 -89.0503 -127.994C-89.0503 -363.329 101.726 -554.105 337.061 -554.105C572.395 -554.105 763.172 -363.329 763.172 -127.994Z"
					fill={ `url(#${ grad })` }
				/>
			</g>
			<defs>
				<filter
					id={ blur }
					x="-315.541"
					y="-780.596"
					width="1305.2"
					height="1305.2"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
					<feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_6772_5737" />
				</filter>
				<linearGradient
					id={ grad }
					x1="763.172"
					y1="-127.994"
					x2="-89.0503"
					y2="-127.994"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#48FF50" />
					<stop offset="0.471846" stopColor="#108642" />
					<stop offset="1" stopColor="#2E38FA" />
				</linearGradient>
			</defs>
		</svg>
	);
}
