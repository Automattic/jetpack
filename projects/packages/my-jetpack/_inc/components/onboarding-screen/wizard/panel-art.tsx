import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
import styles from './styles.module.scss';

/**
 * The brand artwork's own geometry: 14 hairline strokes making the isometric
 * Jetpack bolt inside two organic circles.
 *
 * Copied verbatim from the prototype's `components/onboarding/panel-art.tsx`,
 * which inlined it from Layer_1.svg. It is hand-drawn brand art: the path data
 * and the two stroke widths are not to be redrawn, rounded or simplified.
 *
 * The stroke colour is not here. The prototype writes `#48FF50` on every path;
 * that value is `$brand-gradient-green-bright` in styles.module.scss, so the
 * paths take `currentColor` and the stylesheet is the one place it lives.
 */
const ART_PATHS: { d: string; width: number }[] = [
	{
		d: 'M658.827 323.388C662.115 173.215 560.214 30.5771 400.987 26.5906C278.987 23.5433 167.999 99.9342 106.151 201.163C40.7016 308.277 24.9988 451.896 91.2647 562.558C168.92 692.256 332.879 719.994 460.867 650.199C565.113 593.344 638.058 484.185 655.038 367.469C657.152 352.859 658.43 338.144 658.827 323.388Z',
		width: 0.327402,
	},
	{
		d: 'M610.777 289.158C610.274 408.044 551.42 524.447 456.282 596.079C347.598 677.896 189.837 690.858 86.9936 591.299C-11.348 496.123 -19.1366 341.985 33.939 222.16C80.6496 116.715 175.39 28.824 290.816 6.42852C450.168 -24.5035 588.479 88.8097 608.118 245.703C609.918 260.105 610.756 274.632 610.777 289.158Z',
		width: 0.327402,
	},
	{
		d: 'M321.636 275.049L321.615 592.823L369.477 618.975L369.561 300.847L321.636 275.049Z',
		width: 0.327402,
	},
	{
		d: 'M473.932 253.509L321.636 275.049L369.561 300.847L521.983 279.265L473.932 253.509Z',
		width: 0.982206,
	},
	{
		d: 'M321.615 592.823L473.933 253.509L521.983 279.265L369.477 618.975L321.615 592.823Z',
		width: 0.982206,
	},
	{
		d: 'M138.792 410.591L290.795 388.988L338.678 414.911L186.529 436.576L138.792 410.591Z',
		width: 0.327402,
	},
	{
		d: 'M290.795 71.2773L138.792 410.591L186.529 436.576L338.72 96.8452L290.795 71.2773Z',
		width: 0.982206,
	},
	{
		d: 'M290.795 388.988V71.2773L338.72 96.8452L338.679 414.911L290.795 388.988Z',
		width: 0.982206,
	},
	{
		d: 'M658.954 314.914C658.43 433.946 599.513 550.453 504.27 622.189C395.02 704.487 236.15 717.156 133.37 616.241C30.5893 515.326 28.7469 366.593 82.0527 246.956C129.182 141.219 224.781 53.2859 340.793 31.5792C499.706 1.83689 636.76 115.275 656.294 271.438C658.095 285.861 658.933 300.388 658.954 314.935V314.914Z',
		width: 0.982206,
	},
	{
		d: 'M610.672 297.611C613.959 146.019 509.923 2.88015 349.189 1.06431C228.298 -0.313235 119.006 75.7855 57.8701 176.346C-7.39078 283.752 -22.4655 427.643 44.5542 538.013C122.566 666.458 285.708 693.362 412.921 624.047C517.063 567.317 589.944 458.22 606.883 341.651C608.997 327.061 610.254 312.347 610.651 297.611H610.672Z',
		width: 0.982206,
	},
	{ d: 'M369.477 618.975L521.983 279.265L369.561 300.847L369.477 618.975Z', width: 0.982206 },
	{
		d: 'M473.933 253.509L321.615 592.823V275.049C372.409 267.869 423.16 260.689 473.933 253.509Z',
		width: 0.982206,
	},
	{
		d: 'M338.678 414.911L338.72 96.8452L186.549 436.555C237.259 429.334 287.969 422.112 338.678 414.89V414.911Z',
		width: 0.982206,
	},
	{ d: 'M290.795 71.2773V388.988L138.792 410.591L290.795 71.2773Z', width: 0.982206 },
];

/*
 * The draw-in's stagger, from the prototype's panel-art.tsx: a delay of
 * `0.15 + index * 0.08` seconds. Written as seconds because the CSS duration
 * it runs against is, and kept here rather than in the stylesheet because one
 * selector per path is 14 selectors.
 */
const DRAW_DELAY_BASE_S = 0.15;
const DRAW_DELAY_STEP_S = 0.08;

// The artwork's own coordinate space, from Layer_1.svg.
const ART_VIEW_BOX = '0 0 660 689';

type PanelArtProps = {
	/*
	 * Draw the paths in, one after another. True on the start step only, which
	 * is what the prototype does: its other panels render the art complete.
	 */
	animate?: boolean;
};

/**
 * The brand panel's artwork.
 *
 * Each path's own length is measured and published as `--draw-length`, which the
 * dash rules read. `pathLength` would be tidier, but Chrome only normalises
 * against it for presentation attributes: a `stroke-dasharray` coming from a
 * stylesheet stays in user units, so the whole bolt draws as a 1px dotted line
 * at a third of a pixel wide and nothing appears on screen.
 *
 * @param props         - The component props.
 * @param props.animate - Whether the paths draw themselves in.
 * @return The rendered artwork.
 */
export function PanelArt( { animate = false }: PanelArtProps ) {
	const svgRef = useRef< SVGSVGElement >( null );

	useLayoutEffect( () => {
		if ( ! animate ) {
			return;
		}

		const paths = Array.from( svgRef.current?.querySelectorAll( 'path' ) ?? [] );

		// Chrome rasterises a dashed hairline at far lower coverage than a plain one,
		// so a finished path left dashed renders a third as bright as a static one.
		const clearDash = ( event: AnimationEvent ) =>
			( event.currentTarget as SVGPathElement ).style.setProperty( 'stroke-dasharray', 'none' );

		paths.forEach( path => {
			// jsdom has no SVG geometry, so the measurement is skipped under test.
			if ( typeof path.getTotalLength === 'function' ) {
				path.style.setProperty( '--draw-length', `${ Math.ceil( path.getTotalLength() ) }` );
			}
			path.addEventListener( 'animationend', clearDash, { once: true } );
		} );

		return () => paths.forEach( path => path.removeEventListener( 'animationend', clearDash ) );
	}, [ animate ] );

	return (
		<div
			className={ clsx(
				styles[ 'brand-panel__art' ],
				animate && styles[ 'brand-panel__art--drawing' ]
			) }
		>
			<svg
				ref={ svgRef }
				viewBox={ ART_VIEW_BOX }
				fill="none"
				aria-hidden="true"
				focusable="false"
				className={ styles[ 'brand-panel__art-svg' ] }
			>
				{ ART_PATHS.map( ( path, index ) => (
					<path
						key={ index }
						d={ path.d }
						stroke="currentColor"
						strokeWidth={ path.width }
						strokeMiterlimit={ 10 }
						/*
						 * No vector-effect, as in the prototype. non-scaling-stroke moves
						 * the dash lengths into screen pixels, which is the same trap as
						 * pathLength above by another route.
						 */
						{ ...( animate
							? {
									className: styles[ 'brand-panel__art-path' ],
									style: {
										animationDelay: `${ DRAW_DELAY_BASE_S + index * DRAW_DELAY_STEP_S }s`,
									},
								}
							: {} ) }
					/>
				) ) }
			</svg>
		</div>
	);
}
