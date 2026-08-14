import { formatNumberCompact } from '@automattic/number-formatters';
import { useMemo } from 'react';
import { getBucketResolution, getFormatter } from '../../private/time-axis';
import { TruncatedXTickComponent, TruncatedYTickComponent } from './truncated-tick-component';
import type { EnhancedDataPoint } from '../../../hooks/use-zero-value-display';
import type { DataPointDate, BaseChartProps, SeriesData, TickResolution } from '../../../types';
import type { TickFormatter } from '@visx/axis';

/** Outer padding of the category band scale (space at the chart edges). */
export const BASE_BAND_PADDING = 0.2;
/** Inner padding of the category band scale (the base gap between ticks). */
export const BASE_BAND_PADDING_INNER = 0.1;

// The axis abbreviates to fit a tick; a tooltip has room to spell the same
// bucket out in full.
const TOOLTIP_FORMAT_BY_RESOLUTION: Record<
	Exclude< TickResolution, 'week' >,
	Intl.DateTimeFormatOptions
> = {
	hour: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', hour12: true },
	day: { year: 'numeric', month: 'long', day: 'numeric' },
	month: { year: 'numeric', month: 'long' },
	year: { year: 'numeric' },
};

/**
 * Tick and tooltip formatters for date-based series. Ticks share the line/area
 * charts' time-axis formatter, which also narrows with the overall span; a
 * tooltip labels one bar, so it names that bar's bucket at the bucket's own
 * granularity — finer than the ticks whenever the span coarsens the axis.
 *
 * @param data           - Date-based series, already parsed and sorted by `useChartDataTransform`.
 * @param tickResolution - Caller-declared bucket resolution, when known.
 * @return Tick and tooltip label formatters.
 */
const getTimeSeriesFormatters = ( data: SeriesData[], tickResolution?: TickResolution ) => {
	// Fall back to the day format rather than `undefined` options, which would
	// print a full locale date-time for an unrecognised `tickResolution`.
	const tooltipFormat =
		TOOLTIP_FORMAT_BY_RESOLUTION[ getBucketResolution( data, tickResolution ) ] ??
		TOOLTIP_FORMAT_BY_RESOLUTION.day;
	const tooltipFormatter = ( timestamp: number ) =>
		new Date( timestamp ).toLocaleString( undefined, tooltipFormat );

	return { tickFormatter: getFormatter( data, tickResolution ), tooltipFormatter };
};

/**
 * Get the group padding of a scale.
 *
 * @param scale - The scale to get the group padding of.
 * @return The group padding of the scale.
 */
const getGroupPadding = ( scale: Record< string, unknown > ): number => {
	return typeof scale.paddingInner === 'number' ? ( scale.paddingInner as number ) : 0;
};

/**
 * Returns the merged options for the bar chart, including axis and scale configuration based on the orientation.
 *
 * @param data       - The data to be displayed in the chart.
 * @param horizontal - Whether the chart is horizontal or vertical.
 * @param options    - The options for the chart.
 * @return The merged options for the chart.
 */
export function useBarChartOptions(
	data: SeriesData[],
	horizontal: boolean,
	options: BaseChartProps[ 'options' ] = {}
) {
	// `tickResolution` is a hint for the tick formatter rather than a visx axis
	// prop, so it is read here and stripped from the axis options spread below.
	const tickResolution = horizontal
		? options.axis?.y?.tickResolution
		: options.axis?.x?.tickResolution;

	const defaultOptions = useMemo( () => {
		const bandScale = {
			type: 'band' as const,
			padding: BASE_BAND_PADDING,
			paddingInner: BASE_BAND_PADDING_INNER,
		};
		const linearScale = {
			type: 'linear' as const,
			nice: true,
			zero: false,
		};

		const hasLabels = Boolean( data?.[ 0 ]?.data?.[ 0 ]?.label );
		const timeSeriesFormatters = hasLabels ? null : getTimeSeriesFormatters( data, tickResolution );
		const labelFormatter = timeSeriesFormatters
			? timeSeriesFormatters.tickFormatter
			: ( label: string ) => label;
		const tooltipDatumFormatter = timeSeriesFormatters
			? timeSeriesFormatters.tooltipFormatter
			: labelFormatter;
		const valueFormatter = formatNumberCompact as TickFormatter< unknown >;

		const labelAccessor = ( d: DataPointDate ) => d?.label || d?.date;
		const valueAccessor = ( d: DataPointDate | EnhancedDataPoint ) => {
			// Use visualValue for bar rendering if available (for zero values), otherwise use value
			const enhancedPoint = d as EnhancedDataPoint;
			return enhancedPoint?.visualValue !== undefined ? enhancedPoint.visualValue : d?.value;
		};

		return {
			vertical: {
				xTickFormat: labelFormatter,
				yTickFormat: valueFormatter,
				tooltipLabelFormatter: tooltipDatumFormatter,
				xAccessor: labelAccessor,
				yAccessor: valueAccessor,
				gridVisibility: 'x',
				xScale: bandScale,
				yScale: linearScale,
			},
			horizontal: {
				xTickFormat: valueFormatter,
				yTickFormat: labelFormatter,
				tooltipLabelFormatter: tooltipDatumFormatter,
				xAccessor: valueAccessor,
				yAccessor: labelAccessor,
				gridVisibility: 'y',
				xScale: linearScale,
				yScale: bandScale,
			},
		};
	}, [ data, tickResolution ] );

	return useMemo( () => {
		const orientationKey = horizontal ? 'horizontal' : 'vertical';
		const {
			xTickFormat,
			yTickFormat,
			tooltipLabelFormatter: defaultTooltipLabelFormatter,
			xAccessor,
			yAccessor,
			gridVisibility,
			xScale: baseXScale,
			yScale: baseYScale,
		} = defaultOptions[ orientationKey ];

		// When comparison series are present, visx only sees primary BarSeries and computes
		// a too-narrow domain. Compute an explicit domain spanning all series so comparison
		// shadows aren't clipped. Skip when the user has already provided an explicit domain.
		let valueScaleDomainOverride: { domain?: [ number, number ] } = {};
		const hasComparisonSeries = data.some( s => s.options?.type === 'comparison' );
		if ( hasComparisonSeries ) {
			const valueAxisIsY = ! horizontal;
			const userDomain = valueAxisIsY ? options.yScale?.domain : options.xScale?.domain;
			if ( ! userDomain ) {
				const allValues: number[] = [];
				data.forEach( series => {
					series.data.forEach( d => {
						const enhanced = d as { visualValue?: number };
						const v =
							enhanced.visualValue !== undefined ? enhanced.visualValue : ( d.value as number );
						if ( typeof v === 'number' && Number.isFinite( v ) ) {
							allValues.push( v );
						}
					} );
				} );
				if ( allValues.length > 0 ) {
					// Keep zero in the domain so bar length stays proportional to value — a
					// non-zero baseline would exaggerate differences between periods. Math.max
					// keeps zero on the far side too, so charts with negative values still span 0.
					valueScaleDomainOverride = {
						domain: [ Math.min( 0, ...allValues ), Math.max( 0, ...allValues ) ],
					};
				}
			}
		}

		const xScale = {
			...baseXScale,
			...( options.xScale || {} ),
			...( horizontal ? valueScaleDomainOverride : {} ),
		};
		const yScale = {
			...baseYScale,
			...( options.yScale || {} ),
			...( ! horizontal ? valueScaleDomainOverride : {} ),
		};
		const providedToolTipLabelFormatter = horizontal
			? options.axis?.y?.tickFormat
			: options.axis?.x?.tickFormat;

		const { labelOverflow: xLabelOverflow, ...xAxisOptions } = options.axis?.x || {};
		const { labelOverflow: yLabelOverflow, ...yAxisOptions } = options.axis?.y || {};
		// Consumed above as a formatter hint; visx has no such axis prop.
		delete xAxisOptions.tickResolution;
		delete yAxisOptions.tickResolution;

		return {
			gridVisibility,
			xScale,
			yScale,
			accessors: {
				xAccessor,
				yAccessor,
			},
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: 4,
					tickFormat: xTickFormat,
					...( xLabelOverflow === 'ellipsis' ? { tickComponent: TruncatedXTickComponent } : {} ),
					...xAxisOptions,
				},
				y: {
					orientation: 'left' as const,
					numTicks: 4,
					tickFormat: yTickFormat,
					...( yLabelOverflow === 'ellipsis' ? { tickComponent: TruncatedYTickComponent } : {} ),
					...yAxisOptions,
				},
			},
			barGroup: {
				padding: getGroupPadding( horizontal ? yScale : xScale ),
			},
			tooltip: {
				labelFormatter: providedToolTipLabelFormatter || defaultTooltipLabelFormatter,
			},
		};
	}, [ defaultOptions, options, horizontal, data ] );
}
