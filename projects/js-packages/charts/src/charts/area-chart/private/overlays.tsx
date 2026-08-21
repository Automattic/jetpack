import { DataContext, TooltipContext } from '@visx/xychart';
import { useContext, useImperativeHandle } from 'react';
import type { ElementStyles, GetElementStylesParams } from '../../../providers';
import type { DataPointDate, SeriesData } from '../../../types';
import type { SingleChartRef } from '../../private/single-chart-context';
import type { FC, ReactNode, Ref } from 'react';

export type VisibleSeriesEntry = { series: SeriesData; index: number; isVisible: boolean };

// AreaChart only configures time + linear scales; cast to a callable shape
// instead of spreading `any`. `Number(...)` + `isFinite` guards every call.
type ScaleFn = ( input: Date | number ) => number;

// Bridges visx's `DataContext` to the chart's `SingleChartRef` so consumers
// can read scales and dimensions imperatively. Must be inside `<XYChart>`.
export const AreaChartScalesRef: FC< {
	chartRef?: Ref< SingleChartRef >;
	width: number;
	height: number;
	margin?: { top?: number; right?: number; bottom?: number; left?: number };
} > = ( { chartRef, width, height, margin } ) => {
	const context = useContext( DataContext );

	useImperativeHandle(
		chartRef,
		() => ( {
			getScales: () => {
				if ( ! context?.xScale || ! context?.yScale ) return null;
				return { xScale: context.xScale, yScale: context.yScale };
			},
			getChartDimensions: () => ( { width, height, margin: margin || {} } ),
		} ),
		[ context, width, height, margin ]
	);

	return null;
};

// Hover indicators for each visible series. visx's `showSeriesGlyphs`
// mispositions on AreaStack (its registered yAccessor expects a stack-bar
// but receives the unwrapped datum, yielding NaN), so we compute positions
// from the chart's scales: cumulative top edge for stacked + offset='none'
// (matches d3-stack — missing values count as 0); raw y for unstacked.
// Skipped for `expand`/`wiggle`/`silhouette` — exact positions there would
// need re-running the d3-stack layout.
export const HoverGlyphs: FC< {
	visibleSeries: VisibleSeriesEntry[];
	stacked: boolean;
	stackOffset: 'none' | 'expand' | 'wiggle' | 'silhouette';
	getElementStyles: ( params: GetElementStylesParams ) => ElementStyles;
	strokeColor: string;
} > = ( { visibleSeries, stacked, stackOffset, getElementStyles, strokeColor } ) => {
	const dataContext = useContext( DataContext );
	const tooltipContext = useContext( TooltipContext );

	const xScale = dataContext?.xScale as ScaleFn | undefined;
	const yScale = dataContext?.yScale as ScaleFn | undefined;
	const tooltipOpen = tooltipContext?.tooltipOpen;
	const nearestDatum = tooltipContext?.tooltipData?.nearestDatum?.datum as
		| DataPointDate
		| undefined;

	if (
		! tooltipOpen ||
		! xScale ||
		! yScale ||
		! nearestDatum ||
		! nearestDatum.date ||
		( stacked && stackOffset !== 'none' )
	) {
		return null;
	}

	const xPx = Number( xScale( nearestDatum.date ) );
	if ( ! Number.isFinite( xPx ) ) return null;

	const hoveredTime = nearestDatum.date.getTime();
	let cumulative = 0;
	const circles: ReactNode[] = [];

	// Always advance `cumulative` (d3-stack treats missing/null as 0), but
	// only render a glyph when the series has a real value at this x.
	for ( const { series, index } of visibleSeries ) {
		const datum = series.data.find(
			d => ( d as DataPointDate ).date?.getTime() === hoveredTime
		) as DataPointDate | undefined;

		const value = datum?.value ?? 0;
		if ( stacked ) {
			cumulative += value;
		}

		if ( ! datum || datum.value == null ) {
			continue;
		}

		const yPx = Number( yScale( stacked ? cumulative : value ) );
		if ( ! Number.isFinite( yPx ) ) continue;

		const { color } = getElementStyles( { data: series, index } );
		circles.push(
			<circle
				key={ series.label || index }
				cx={ xPx }
				cy={ yPx }
				r={ 4 }
				fill={ color }
				stroke={ strokeColor }
				strokeWidth={ 1.5 }
				paintOrder="fill"
				data-testid={ `area-chart-hover-glyph-${ index }` }
			/>
		);
	}

	if ( circles.length === 0 ) return null;

	return (
		<g pointerEvents="none" className="area-chart__hover-glyphs">
			{ circles }
		</g>
	);
};
