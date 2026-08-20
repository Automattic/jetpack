import { scaleBand } from '@visx/scale';
import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { computeComparisonRect, getValueScaleBaseline } from './comparison-bars-geometry';
import {
	DEFAULT_COMPARISON_OPACITY,
	DEFAULT_COMPARISON_WIDTH_FACTOR,
} from './comparison-constants';
import type { ElementStyles, GetElementStylesParams } from '../../../providers';
import type { DataPointDate, SeriesData } from '../../../types';
import type { FC, ReactNode } from 'react';

/*
 * `process.env.NODE_ENV` is replaced by the bundler at build time. Declare a
 * minimal `process` locally so this file type-checks as source under `jetpack:src`.
 */
declare const process: { env: Record< string, string | undefined > };

export type ComparisonSeriesEntry = {
	series: SeriesData;
	index: number;
	primaryKey: string;
	/** dataSorted index of the paired primary series (used to share its pattern fill). */
	primaryIndex: number;
};

// Minimal shape we need from visx scales — avoids spreading `any` while
// remaining compatible with both band and continuous scale return types.
type AnyScale = ( ( input: unknown ) => number ) & {
	bandwidth?: () => number;
	range: () => unknown[];
};

// Renders translucent "shadow" bars for comparison series behind their paired primary bars.
// IMPORTANT: each comparison datum's category key (label or date) must exactly match a key
// used by the primary series — if it doesn't, bandScale() returns undefined and the shadow
// is silently skipped. Ensure comparison data reuses the same label/date values as primary.
export const ComparisonBars: FC< {
	comparisonEntries: ComparisonSeriesEntry[];
	primaryKeys: string[];
	groupPadding: number;
	horizontal: boolean;
	xAccessor: ( d: DataPointDate ) => string | number | Date | undefined;
	yAccessor: ( d: DataPointDate ) => number | undefined;
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
	/** Resolves the shadow fill — the paired primary's pattern when patterns are on, else a color. */
	resolveFill: ( entry: ComparisonSeriesEntry ) => string;
} > = ( {
	comparisonEntries,
	primaryKeys,
	groupPadding,
	horizontal,
	xAccessor,
	yAccessor,
	getElementStyles,
	resolveFill,
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

	comparisonEntries.forEach( entry => {
		const { series, index, primaryKey } = entry;
		const slotOffset = groupScale( primaryKey );
		if ( slotOffset == null || ! Number.isFinite( slotOffset ) ) {
			return;
		}

		const { barStyles } = getElementStyles( { data: series, index } );
		const opacity = barStyles?.opacity ?? DEFAULT_COMPARISON_OPACITY; // safety net; CompleteChartTheme guarantees this value
		const widthFactor = barStyles?.widthFactor ?? DEFAULT_COMPARISON_WIDTH_FACTOR;
		// Fill is the paired primary's pattern (when patterns are on) or its resolved color.
		const fill = resolveFill( entry );
		// The shadow is `widthFactor` × the (narrowed) primary slot. bar-chart.tsx narrows the
		// primary bars by widening the group padding so this ratio holds with real geometry.

		( series.data as DataPointDate[] ).forEach( ( datum, i ) => {
			const bandPosition = Number( bandScale( bandAccessor( datum ) as never ) );
			const valuePosition = Number( valueScale( Number( valueAccessor( datum ) ) as never ) );

			if ( ! Number.isFinite( bandPosition ) || ! Number.isFinite( valuePosition ) ) {
				if ( process.env.NODE_ENV !== 'production' && ! Number.isFinite( bandPosition ) ) {
					// eslint-disable-next-line no-console
					console.warn(
						`[Charts] ComparisonBars: datum key "${ String(
							bandAccessor( datum )
						) }" did not match any primary category. Shadow will not be rendered. ` +
							'Ensure comparison series data uses the same label/date keys as the primary series.'
					);
				}
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
					fill={ fill }
					opacity={ opacity }
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
			aria-hidden="true"
			data-testid="bar-chart-comparison-bars"
		>
			{ rects }
		</g>
	);
};
