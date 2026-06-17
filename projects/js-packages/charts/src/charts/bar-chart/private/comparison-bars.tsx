import { scaleBand } from '@visx/scale';
import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { computeComparisonRect, getValueScaleBaseline } from './comparison-bars-geometry';
import type { ElementStyles, GetElementStylesParams } from '../../../providers';
import type { DataPointDate, SeriesData } from '../../../types';
import type { FC, ReactNode } from 'react';

export type ComparisonSeriesEntry = { series: SeriesData; index: number; primaryKey: string };

// Minimal shape we need from visx scales — avoids spreading `any` while
// remaining compatible with both band and continuous scale return types.
type AnyScale = ( ( input: unknown ) => number ) & {
	bandwidth?: () => number;
	range: () => unknown[];
};

export const ComparisonBars: FC< {
	comparisonEntries: ComparisonSeriesEntry[];
	primaryKeys: string[];
	groupPadding: number;
	horizontal: boolean;
	xAccessor: ( d: DataPointDate ) => string | number | Date | undefined;
	yAccessor: ( d: DataPointDate ) => number | undefined;
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
} > = ( {
	comparisonEntries,
	primaryKeys,
	groupPadding,
	horizontal,
	xAccessor,
	yAccessor,
	getElementStyles,
} ) => {
	const context = useContext( DataContext );
	const xScale = context?.xScale as AnyScale | undefined;
	const yScale = context?.yScale as AnyScale | undefined;

	if ( ! xScale || ! yScale || primaryKeys.length === 0 ) {
		return null;
	}

	// Vertical: band axis is x, value axis is y. Horizontal: reversed.
	const bandScale = ( horizontal ? yScale : xScale ) as AnyScale;
	const valueScale = ( horizontal ? xScale : yScale ) as AnyScale;

	const bandwidth = bandScale.bandwidth ? bandScale.bandwidth() : 0;
	if ( ! bandwidth ) {
		return null;
	}

	// Rebuild visx's inner group scale exactly as BarGroup does.
	const groupScale = scaleBand( {
		domain: primaryKeys,
		range: [ 0, bandwidth ],
		padding: groupPadding,
	} );
	const slotThickness = groupScale.bandwidth();
	const baseline = getValueScaleBaseline( valueScale );

	// Vertical uses xAccessor for category label; horizontal uses yAccessor.
	const bandAccessor = horizontal ? yAccessor : xAccessor;
	const valueAccessor = horizontal ? xAccessor : yAccessor;

	const rects: ReactNode[] = [];

	comparisonEntries.forEach( ( { series, index, primaryKey } ) => {
		const slotOffset = groupScale( primaryKey );
		if ( slotOffset == null || ! Number.isFinite( slotOffset ) ) {
			return;
		}

		const { color, barStyles } = getElementStyles( { data: series, index } );
		const widthFactor = barStyles?.widthFactor ?? 1.5;
		const opacity = barStyles?.opacity ?? 0.5;

		( series.data as DataPointDate[] ).forEach( ( datum, i ) => {
			const bandPosition = Number( bandScale( bandAccessor( datum ) as never ) );
			const valuePosition = Number( valueScale( Number( valueAccessor( datum ) ) as never ) );

			if ( ! Number.isFinite( bandPosition ) || ! Number.isFinite( valuePosition ) ) {
				return;
			}

			const rect = computeComparisonRect( {
				horizontal,
				bandPosition,
				slotOffset: slotOffset as number,
				slotThickness,
				valuePosition,
				baseline,
				widthFactor,
			} );

			rects.push(
				<rect
					key={ `${ index }-${ i }` }
					data-testid={ `bar-chart-comparison-${ index }-${ i }` }
					x={ rect.x }
					y={ rect.y }
					width={ rect.width }
					height={ rect.height }
					fill={ color }
					opacity={ opacity }
					rx={ barStyles?.rx }
				/>
			);
		} );
	} );

	if ( rects.length === 0 ) {
		return null;
	}

	return (
		<g
			className="bar-chart__comparison-bars"
			pointerEvents="none"
			data-testid="bar-chart-comparison-bars"
		>
			{ rects }
		</g>
	);
};
