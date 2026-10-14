import { DataContext, GlyphSeries } from '@visx/xychart';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
import { getValueScaleBaseline } from './comparison-bars-geometry';
import { OVERLAP_INNER_WIDTH_RATIO, OVERLAP_OUTLINE_WIDTH } from './overlap-constants';
import { isBarRendered } from './value-domain';
import type { BandScale } from './band-scale';
import type { DataPointDate, SeriesData } from '../../../types';
import type { BarChartProps } from '../types';
import type { GlyphProps } from '@visx/xychart';
import type { FC } from 'react';

type ValueScale = Parameters< typeof getValueScaleBaseline >[ 0 ];

type Props = {
	series: SeriesData;
	/** The series' position among the visible primaries, in data order. */
	seriesIndex: number;
	part: 'outer' | 'inner';
	fill: ( datum: DataPointDate ) => string;
	outline?: string;
	xAccessor: ( datum: DataPointDate ) => unknown;
	yAccessor: ( datum: DataPointDate ) => number;
	barClassName?: BarChartProps[ 'barClassName' ];
};

// One series of the vertical overlap layout: the outer part fills the band, the inner is centered.
export const OverlapBarSeries: FC< Props > = ( {
	series,
	seriesIndex,
	part,
	fill,
	outline,
	xAccessor,
	yAccessor,
	barClassName,
} ) => {
	const { xScale, yScale } = useContext( DataContext );
	const bandScale = xScale as BandScale | undefined;
	const valueScale = yScale as ValueScale | undefined;

	const renderGlyph = useCallback(
		( { datum, key }: GlyphProps< DataPointDate > ) => {
			if ( ! bandScale?.bandwidth || ! valueScale || ! isBarRendered( datum ) ) {
				return null;
			}
			const bandwidth = bandScale.bandwidth();
			const width = part === 'outer' ? bandwidth : bandwidth * OVERLAP_INNER_WIDTH_RATIO;
			const baseline = getValueScaleBaseline( valueScale );
			const valuePosition = Number( valueScale( yAccessor( datum ) ) );
			// visx hands the datum's position in `data` only as the glyph key.
			const pointIndex = Number( key );
			return (
				<rect
					className={ clsx( 'visx-bar', 'bar-chart__overlap-bar', barClassName?.( datum ) ) }
					data-testid={ `bar-chart-overlap-${ part }-${ pointIndex }` }
					data-series-index={ seriesIndex }
					data-point-index={ pointIndex }
					x={ Number( bandScale( xAccessor( datum ) ) ) + ( bandwidth - width ) / 2 }
					y={ Math.min( valuePosition, baseline ) }
					width={ width }
					height={ Math.abs( baseline - valuePosition ) }
					fill={ fill( datum ) }
					stroke={ outline }
					strokeWidth={ outline ? OVERLAP_OUTLINE_WIDTH : undefined }
				/>
			);
		},
		[ bandScale, valueScale, part, seriesIndex, fill, outline, xAccessor, yAccessor, barClassName ]
	);

	return (
		<GlyphSeries
			dataKey={ series.label }
			data={ series.data as DataPointDate[] }
			xAccessor={ xAccessor }
			yAccessor={ yAccessor }
			renderGlyph={ renderGlyph }
		/>
	);
};
