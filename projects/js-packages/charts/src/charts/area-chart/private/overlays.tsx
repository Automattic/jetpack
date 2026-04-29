import { DataContext, TooltipContext } from '@visx/xychart';
import { useContext, useImperativeHandle } from 'react';
import type { ElementStyles, GetElementStylesParams } from '../../../providers';
import type { DataPointDate, SeriesData } from '../../../types';
import type { SingleChartRef } from '../../private/single-chart-context';
import type { FC, ReactNode, Ref } from 'react';

export type VisibleSeriesEntry = { series: SeriesData; index: number; isVisible: boolean };

// Narrowed call signature for the visx `xScale` / `yScale` we read from
// `DataContext`. The real type is `AxisScale` (a wider d3-scale union with a
// `NumberLike` return), but the only scales this chart configures are time +
// linear and the call site wraps the result in `Number(...)` + `isFinite`,
// so this narrower shape is safe in practice without spreading `any`.
type ScaleFn = ( input: Date | number ) => number;

// Bridges the visx `DataContext` (xScale / yScale) up to the chart's
// `SingleChartRef` so consumers can read scales and dimensions imperatively.
// Must be rendered inside `<XYChart>` to access the scales.
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

// SVG overlay rendering a circle at each visible series for the currently
// hovered x-position. visx's `showSeriesGlyphs` doesn't work for AreaStack
// (registered yAccessor expects a stack-bar but receives the unwrapped
// DataPointDate, returning NaN), so glyph positions are computed from the
// chart's own scales. Stacked + offset='none' renders at the cumulative top
// edge of each band, matching d3-stack semantics (missing values count as 0
// in the running total). Other stack offsets ('expand', 'wiggle', 'silhouette')
// are skipped — recovering exact positions there would require re-running
// the d3-stack layout. Unstacked renders at the series' raw y-value. Must be
// rendered inside `<XYChart>` to access `DataContext` and `TooltipContext`.
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

	// Iterate ALL visible series — never short-circuit — so missing-x-domain
	// gaps don't break the cumulative offset for subsequent series.
	for ( const { series, index } of visibleSeries ) {
		const datum = series.data.find(
			d => ( d as DataPointDate ).date?.getTime() === hoveredTime
		) as DataPointDate | undefined;

		// d3-stack treats missing-or-null values as 0 in the running total,
		// so we coerce here and always advance the cumulative baseline before
		// the skip guard. Without this, glyphs for series above a null point
		// would land at the wrong stacked y.
		const value = datum?.value ?? 0;
		if ( stacked ) {
			cumulative += value;
		}

		// Skip rendering a glyph when the datum is missing or null-valued —
		// the area itself collapses to baseline at that x, so a glyph would
		// be misleading.
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
