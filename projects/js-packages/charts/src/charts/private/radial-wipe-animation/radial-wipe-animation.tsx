/**
 * This animation uses the SVG self-drawing technique (source: https://www.joshwcomeau.com/svg/friendly-introduction-to-svg/),
 * leveraging stroke-dasharray and stroke-dashoffset properties to create the effect.
 *
 * Here, we reverse the animation to "un-draw" the circle for the revealing / radial wipe effect:
 * - Initially, the entire circle is drawn with a white mask.
 * - The circle's border (stroke) is drawn with a black stroke, wide enough to cover the circle.
 * - The stroke is then "un-drawn," creating the wipe animation.
 * - A white mask makes the area visible, while a black mask makes the area invisible.
 */

type Angle = `${ number }deg` | `${ number }rad` | `${ number }grad` | `${ number }turn` | 0 | '0';

/**
 * RadialWipeAnimationProps - SVG mask props that requires a radial wipe animation effect.
 *
 * @param {object}                            props                         - The properties object.
 * @param {string}                            props.id                      - The unique ID for the mask.
 * @param {number}                            props.radius                  - The outer radius of the radial wipe.
 * @param {number}                            [props.innerRadius=0]         - The inner radius of the radial wipe.
 * @param {number}                            [props.durationMs=1000]       - The duration of the animation in milliseconds.
 * @param {number}                            [props.wipePercentage=100]    - The percentage of the wipe animation to complete.
 * @param {'clockwise' | 'counter-clockwise'} [props.direction='clockwise'] - The direction of the wipe animation.
 * @param {Angle}                             [props.startAngle='-90deg']   - The starting angle of the wipe animation.
 *
 * @return {JSX.Element} The radial wipe mask element.
 */
export type RadialWipeAnimationProps = {
	id: string;
	radius: number;
	innerRadius?: number;
	durationMs?: number;
	startAngle?: Angle;
	direction?: 'clockwise' | 'counter-clockwise';
	wipePercentage?: number;
};

/**
 * Renders a SVG mask that creates a radial wipe animation effect.
 *
 * @param {RadialWipeAnimationProps} props - Component props
 * @return {JSX.Element} The rendered mask component
 */
function RadialWipeAnimation( {
	id,
	radius,
	innerRadius = 0,
	durationMs = 1000,
	wipePercentage = 100,
	direction = 'clockwise',
	startAngle = '-90deg',
}: RadialWipeAnimationProps ) {
	const strokeWidth =
		( radius - innerRadius ) * 2 + // The stroke is centered on the circumference, so we need to double the width.
		1; // Added 1 to prevent sub-pixel rendering issues.

	const scaleY = direction === 'clockwise' ? -1 : 1;

	const isValidWipePercentage = 0 < wipePercentage && wipePercentage <= 100;
	const animationDuration = `${
		// If wipePercentage is invalid, set animation duration to 0 to disable animation.
		isValidWipePercentage ? durationMs * ( 100 / wipePercentage ) : 0
	}ms`;

	return (
		<mask id={ id }>
			<circle
				cx={ 0 }
				cy={ 0 }
				r={ radius }
				pathLength="100"
				fill="white"
				stroke="black" // The stroke will be un-drawn, hence 'black' mask.
				strokeWidth={ strokeWidth }
				strokeDasharray="100, 1000"
				strokeDashoffset="0"
				style={ { transform: `rotate(${ startAngle }) scaleY(${ scaleY })` } }
			>
				<animate
					attributeName="stroke-dashoffset"
					from="0"
					to="100.1"
					dur={ animationDuration }
					fill="freeze" // Same as CSS 'forwards' to retain the final state after animation.
					calcMode="spline" // custom easing
					keySplines="0.42 0 0.58 1;0 0 1 1" // ease-in-out ; linear (unimportant)
					keyTimes={ `0;${ wipePercentage / 100 };1` }
				/>
			</circle>
		</mask>
	);
}

export default RadialWipeAnimation;
