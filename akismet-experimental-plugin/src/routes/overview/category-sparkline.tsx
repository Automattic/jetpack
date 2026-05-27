/**
 * `<CategorySparkline>` — minimal SVG area chart for the Overview cards.
 *
 * Per the Trap #1 decision recorded with the project owner, this is a
 * pure-SVG implementation — no @automattic/charts dep. Renders a filled
 * area underneath a stroked line in the current `color` value so the
 * card's theme color (var(--wp-admin-theme-color)) flows through.
 *
 * Each unique sparkline gets a unique gradient id so multiple sparklines
 * on the same page don't share <defs>. The id is derived from the label
 * (kebabed) plus the first point's date as a coarse hash — collisions
 * within one page are vanishingly unlikely with at most 6 cards.
 */
import type { CategorySeriesPoint } from '@/lib/category-adapters';

type Props = {
	series: CategorySeriesPoint[];
	label: string;
};

const WIDTH = 300;
const HEIGHT = 60;
const PAD_Y = 4;

/**
 * Coarse stable id for the gradient `<defs>` element. We derive from the
 * label + first date so two cards rendering the same category on the same
 * page never collide on gradient ids.
 *
 * @param label  - The card's accessible name.
 * @param series - The data series being plotted.
 * @return A DOM-safe id string.
 */
function gradientId( label: string, series: CategorySeriesPoint[] ): string {
	const slug = label
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-|-$/g, '' );
	const seed = series[ 0 ]?.date.replace( /-/g, '' ) ?? '0';
	return `akismet-spark-${ slug }-${ seed }`;
}

/**
 * Render a filled area sparkline scaled into a 300×60 viewBox.
 *
 * @param props - The component props.
 * @return Sparkline SVG, or null if the series is empty.
 */
export function CategorySparkline( props: Props ): JSX.Element | null {
	const { series, label } = props;

	if ( series.length === 0 ) {
		return null;
	}

	const id = gradientId( label, series );

	const values = series.map( p => p.blocked );
	const max = Math.max( ...values );
	const min = Math.min( ...values );
	const range = max - min || 1;
	const stepX = series.length > 1 ? WIDTH / ( series.length - 1 ) : 0;

	const pts: Array< [ number, number ] > = series.map( ( p, i ) => {
		const x = series.length === 1 ? WIDTH / 2 : i * stepX;
		const y = HEIGHT - PAD_Y - ( ( p.blocked - min ) / range ) * ( HEIGHT - PAD_Y * 2 );
		return [ Number( x.toFixed( 1 ) ), Number( y.toFixed( 1 ) ) ];
	} );

	// Quadratic-bezier smoothing — each segment uses the midpoint of two
	// data points as the control anchor so the curve never overshoots.
	const linePath = pts.reduce( ( acc, [ x, y ], i, arr ) => {
		if ( i === 0 ) {
			return `M ${ x } ${ y }`;
		}
		const [ px, py ] = arr[ i - 1 ];
		const cx = ( px + x ) / 2;
		return `${ acc } Q ${ cx } ${ py } ${ cx } ${ ( py + y ) / 2 } T ${ x } ${ y }`;
	}, '' );

	// Area path: extend the smoothed line down to the baseline and back to
	// the start so the gradient fill closes cleanly.
	const areaPath = `${ linePath } L ${ pts[ pts.length - 1 ][ 0 ] } ${ HEIGHT } L ${
		pts[ 0 ][ 0 ]
	} ${ HEIGHT } Z`;

	return (
		<svg
			className="akismet-category-card__sparkline"
			width="100%"
			height={ HEIGHT }
			viewBox={ `0 0 ${ WIDTH } ${ HEIGHT }` }
			role="img"
			aria-label={ label }
			preserveAspectRatio="none"
		>
			<defs>
				<linearGradient
					data-testid="akismet-sparkline-gradient"
					id={ id }
					x1="0"
					y1="0"
					x2="0"
					y2="1"
				>
					<stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
					<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
			</defs>
			<path
				data-testid="akismet-sparkline-area"
				d={ areaPath }
				fill={ `url(#${ id })` }
				stroke="none"
			/>
			<path
				data-testid="akismet-sparkline-polyline"
				d={ linePath }
				fill="none"
				stroke="currentColor"
				strokeOpacity="0.85"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
