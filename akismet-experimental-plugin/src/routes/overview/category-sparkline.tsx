/**
 * `<CategorySparkline>` — minimal SVG sparkline for the Overview cards.
 *
 * The plan originally called for `@automattic/charts` (LineChart) but that
 * package is monorepo-internal and pulls deps the standalone plugin can't
 * resolve. Per the Trap #1 decision recorded with the project owner, a
 * pure-SVG implementation is the right call here — the sparkline is 56px
 * tall and never needs interactivity. ~30 lines beats a 100KB dep.
 *
 * If a future plan needs axes, tooltips, or BarChart variants, swap to a
 * real charting library at that point.
 */
import type { CategorySeriesPoint } from '@/lib/category-adapters';

type Props = {
	series: CategorySeriesPoint[];
	label: string;
};

const WIDTH = 120;
const HEIGHT = 32;
const PAD_Y = 4;

/**
 * Render a polyline sparkline scaled into a fixed 120×32 viewBox.
 *
 * @param props - The component props.
 * @return Sparkline SVG, or null if the series is empty.
 */
export function CategorySparkline( props: Props ): JSX.Element | null {
	const { series, label } = props;

	if ( series.length === 0 ) {
		return null;
	}

	const values = series.map( p => p.blocked );
	const max = Math.max( ...values );
	const min = Math.min( ...values );
	const range = max - min || 1; // guard against flat series + single-point
	const stepX = series.length > 1 ? WIDTH / ( series.length - 1 ) : 0;

	const points = series
		.map( ( p, i ) => {
			const x = series.length === 1 ? WIDTH / 2 : i * stepX;
			const y = HEIGHT - PAD_Y - ( ( p.blocked - min ) / range ) * ( HEIGHT - PAD_Y * 2 );
			return `${ x.toFixed( 1 ) },${ y.toFixed( 1 ) }`;
		} )
		.join( ' ' );

	return (
		<svg
			className="akismet-category-card__sparkline"
			width={ WIDTH }
			height={ HEIGHT }
			viewBox={ `0 0 ${ WIDTH } ${ HEIGHT }` }
			role="img"
			aria-label={ label }
			preserveAspectRatio="none"
		>
			<polyline
				data-testid="akismet-sparkline-polyline"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				points={ points }
			/>
		</svg>
	);
}
