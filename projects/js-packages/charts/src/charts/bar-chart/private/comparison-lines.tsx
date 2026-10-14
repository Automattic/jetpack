import { DataContext, LineSeries } from '@visx/xychart';
import { useContext } from 'react';
import { CATALOG_POINTERS } from '../../../providers/chart-context/private/catalog-pointers';
import { getComparisonLineWidth } from './comparison-line-paint';
import { ComparisonMarkerShape } from './comparison-marker';
import { COMPARISON_LINE_CASING } from './overlap-constants';
import type { BandScale } from './band-scale';
import type { DataPointDate, SeriesData } from '../../../types';
import type { BarOverlapStyles } from '../types';
import type { LinePaint } from './comparison-line-paint';
import type { FC } from 'react';

type Comparison = BarOverlapStyles[ 'comparisons' ][ number ];
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

	return (
		<>
			{ points.map( ( point, index ) => {
				const cx = Number( bandScale( xAccessor( point ) ) ) + halfBand;
				const cy = Number( valueScale( getReading( point ) ) );
				if ( ! Number.isFinite( cx ) || ! Number.isFinite( cy ) ) {
					return null;
				}
				return (
					<ComparisonMarkerShape
						key={ index }
						data-testid={ `bar-chart-comparison-marker-${ comparison.label }-${ index }` }
						marker={ comparison.marker }
						cx={ cx }
						cy={ cy }
						fill={ comparison.stroke }
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
export const ComparisonLines: FC< Props > = ( { comparisons, data, xAccessor } ) => {
	const drawn = comparisons.flatMap( comparison => {
		const series = data.find( item => item.label === comparison.label );
		return series ? [ { comparison, points: series.data as DataPointDate[] } ] : [];
	} );

	return (
		<g className="bar-chart__comparison-lines" pointerEvents="none" aria-hidden="true">
			{ drawn.map( ( { comparison, points } ) => {
				const paint: LinePaint = comparison.lineStyles;
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
								strokeWidth={ getComparisonLineWidth( paint ) + COMPARISON_LINE_CASING * 2 }
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
					</g>
				);
			} ) }
			{ /* After every line, so no marker sits under the other comparison's line. */ }
			{ drawn.map( ( { comparison, points } ) => (
				<ComparisonMarkers
					key={ comparison.label }
					comparison={ comparison }
					points={ points }
					xAccessor={ xAccessor }
				/>
			) ) }
		</g>
	);
};
