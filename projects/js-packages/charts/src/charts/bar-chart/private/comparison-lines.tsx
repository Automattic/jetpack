import { DataContext, LineSeries } from '@visx/xychart';
import { useContext } from 'react';
import { CATALOG_POINTERS } from '../../../providers/chart-context/private/catalog-pointers';
import {
	COMPARISON_LINE_CASING,
	COMPARISON_MARKER_HALO,
	COMPARISON_MARKER_SIZE,
} from './overlap-constants';
import type { BandScale } from './band-scale';
import type { DataPointDate, SeriesData } from '../../../types';
import type { BarOverlapStyles } from '../types';
import type { LineStyles } from '@visx/xychart';
import type { DOMAttributes, FC } from 'react';

type Comparison = BarOverlapStyles[ 'comparisons' ][ number ];
// LineSeries types its handlers as visx callbacks and positions the path itself.
type LinePaint = Omit< LineStyles, keyof DOMAttributes< SVGLineElement > | 'x' | 'y' >;
type XAccessor = ( datum: DataPointDate ) => unknown;

// The raw reading, not the zero-value stub, so a zero sits on the baseline and a gap stays a gap.
const getReading = ( datum: DataPointDate ) =>
	Number.isFinite( datum.value ) ? ( datum.value as number ) : NaN;

const ComparisonMarkers: FC< {
	comparison: Comparison;
	points: DataPointDate[];
	xAccessor: XAccessor;
} > = ( { comparison, points, xAccessor } ) => {
	const { xScale, yScale } = useContext( DataContext );
	const bandScale = xScale as BandScale | undefined;
	const valueScale = yScale as ( ( value: number ) => number | undefined ) | undefined;

	if ( ! bandScale?.bandwidth || ! valueScale ) {
		return null;
	}

	const halfBand = bandScale.bandwidth() / 2;
	const paint = {
		fill: comparison.stroke,
		stroke: CATALOG_POINTERS.background,
		strokeWidth: COMPARISON_MARKER_HALO * 2,
		// Stroke first, so the fill covers the halo's inner half.
		paintOrder: 'stroke',
	};

	return (
		<>
			{ points.map( ( point, index ) => {
				const cx = Number( bandScale( xAccessor( point ) ) ) + halfBand;
				const cy = Number( valueScale( getReading( point ) ) );
				if ( ! Number.isFinite( cx ) || ! Number.isFinite( cy ) ) {
					return null;
				}
				const testId = `bar-chart-comparison-marker-${ comparison.label }-${ index }`;
				return comparison.marker === 'square' ? (
					<rect
						key={ index }
						data-testid={ testId }
						x={ cx - COMPARISON_MARKER_SIZE }
						y={ cy - COMPARISON_MARKER_SIZE }
						width={ COMPARISON_MARKER_SIZE * 2 }
						height={ COMPARISON_MARKER_SIZE * 2 }
						{ ...paint }
					/>
				) : (
					<circle
						key={ index }
						data-testid={ testId }
						cx={ cx }
						cy={ cy }
						r={ COMPARISON_MARKER_SIZE }
						{ ...paint }
					/>
				);
			} ) }
		</>
	);
};

type Props = {
	comparisons: BarOverlapStyles[ 'comparisons' ];
	data: SeriesData[];
	xAccessor: XAccessor;
};

// The overlap layout's previous periods: dashed lines with a marker on every reading.
export const ComparisonLines: FC< Props > = ( { comparisons, data, xAccessor } ) => (
	<g className="bar-chart__comparison-lines" pointerEvents="none" aria-hidden="true">
		{ comparisons.map( comparison => {
			const series = data.find( item => item.label === comparison.label );
			if ( ! series ) {
				return null;
			}
			const points = series.data as DataPointDate[];
			const paint: LinePaint = comparison.lineStyles;
			const lineWidth = Number( paint.strokeWidth ?? 2 );
			return (
				<g key={ comparison.label }>
					{ COMPARISON_LINE_CASING > 0 && (
						<LineSeries
							dataKey={ `${ comparison.label }::casing` }
							data={ points }
							xAccessor={ xAccessor }
							yAccessor={ getReading }
							enableEvents={ false }
							stroke={ CATALOG_POINTERS.background }
							strokeWidth={ lineWidth + COMPARISON_LINE_CASING * 2 }
							data-testid={ `bar-chart-comparison-casing-${ comparison.label }` }
						/>
					) }
					<LineSeries
						dataKey={ comparison.label }
						data={ points }
						xAccessor={ xAccessor }
						yAccessor={ getReading }
						enableEvents={ false }
						{ ...paint }
						// After the theme style, so the line matches its markers.
						stroke={ comparison.stroke }
						data-testid={ `bar-chart-comparison-line-${ comparison.label }` }
					/>
					<ComparisonMarkers comparison={ comparison } points={ points } xAccessor={ xAccessor } />
				</g>
			);
		} ) }
	</g>
);
