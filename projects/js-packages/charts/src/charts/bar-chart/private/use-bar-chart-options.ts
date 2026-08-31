import { formatNumberCompact } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { useDeepMemo } from '../../../hooks';
import { getBandTickValues, getBucketResolution, getFormatter } from '../../private/time-axis';
import { TruncatedXTickComponent, TruncatedYTickComponent } from './truncated-tick-component';
import type { EnhancedDataPoint } from '../../../hooks/use-zero-value-display';
import type { DataPointDate, BaseChartProps, SeriesData, TickResolution } from '../../../types';
import type { TickFormatter } from '@visx/axis';

/** Outer padding of the category band scale (space at the chart edges). */
export const BASE_BAND_PADDING = 0.2;
/** Inner padding of the category band scale (the base gap between ticks). */
export const BASE_BAND_PADDING_INNER = 0.1;
/** Ticks each axis carries unless the caller asks for a different count. */
const DEFAULT_NUM_TICKS = 4;

// A stable reference for callers that hide no series, so the memos below hold.
const ALL_RENDERED = () => true;

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
 * Labels one bar's bucket, at the bucket's own granularity — finer than the
 * ticks whenever the overall time span coarsens the axis.
 *
 * @param data           - Date-based series, already parsed and sorted by `useChartDataTransform`.
 * @param tickResolution - Caller-declared bucket resolution, when known.
 * @return Tooltip label formatter.
 */
const getTooltipFormatter = ( data: SeriesData[], tickResolution?: TickResolution ) => {
	// Only a declared 'week' reaches this branch: seven-day spacing is
	// indistinguishable from sparse daily data, so inference reports 'day'.
	if ( tickResolution === 'week' ) {
		return ( timestamp: number ) =>
			sprintf(
				/* translators: %s is the first day of the week the bar covers. */
				__( 'Week of %s', 'jetpack-charts' ),
				new Date( timestamp ).toLocaleDateString( undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				} )
			);
	}

	// Fall back to the day format rather than `undefined` options, which would
	// print a full locale date-time for an unrecognised `tickResolution`.
	const format =
		TOOLTIP_FORMAT_BY_RESOLUTION[ getBucketResolution( data, tickResolution ) ] ??
		TOOLTIP_FORMAT_BY_RESOLUTION.day;

	return ( timestamp: number ) => new Date( timestamp ).toLocaleString( undefined, format );
};

const identity = ( label: string ) => label;

// `hasLabels` only samples the first point of the first series, so a labelled
// bucket can still reach a formatter that was chosen for timestamps. It arrives
// as its own string; only a dated bucket has a timestamp to format.
const byBucket =
	( format: ( timestamp: number ) => string ) => ( bucket: Date | string | number ) =>
		typeof bucket === 'string' ? bucket : format( Number( bucket ) );

// Shared with the domain below so both read a bucket the same way.
const bucketAccessor = ( d: DataPointDate ) => d?.label || d?.date;

/**
 * The buckets the band axis can put a tick on.
 *
 * Built from the accessor visx is given, over the same series in the same order,
 * so that a tick value is a key the scale actually holds; `scaleBand` returns
 * `undefined` for one it does not, which parks the tick at the origin. Null
 * rather than a partial list when any bucket is labelled instead of dated.
 *
 * @param data             - Every series handed to the chart.
 * @param isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it.
 * @return Bucket dates in axis order, or null if the axis cannot be ticked by date.
 */
const getBandDomain = (
	data: SeriesData[],
	isSeriesRendered: ( series: SeriesData ) => boolean
): Date[] | null => {
	// visx keys its data registry on the series label and reads it back with
	// `Object.keys`, so a plain object reproduces both of the things that follow
	// from that: two series sharing a label collapse to the later one, and an
	// integer-like label sorts ahead of the rest whatever order it arrived in.
	const registry: Record< string, SeriesData > = {};

	for ( const series of data ) {
		// Comparison series register nothing with visx — `comparison-bars.tsx` draws
		// onto the scales the primary series established — and a hidden series is
		// unmounted, so neither contributes a key to the band scale.
		if ( series.options?.type === 'comparison' || ! isSeriesRendered( series ) ) {
			continue;
		}
		registry[ series.label ] = series;
	}

	const byTimestamp = new Map< number, Date >();

	for ( const key of Object.keys( registry ) ) {
		for ( const point of registry[ key ].data ) {
			const bucket = bucketAccessor( point as DataPointDate );
			if ( ! ( bucket instanceof Date ) ) {
				return null;
			}
			if ( ! byTimestamp.has( bucket.getTime() ) ) {
				byTimestamp.set( bucket.getTime(), bucket );
			}
		}
	}

	return byTimestamp.size ? [ ...byTimestamp.values() ] : null;
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
 * @param data             - The data to be displayed in the chart.
 * @param horizontal       - Whether the chart is horizontal or vertical.
 * @param options          - The options for the chart.
 * @param isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it.
 * @return The merged options for the chart.
 */
export function useBarChartOptions(
	data: SeriesData[],
	horizontal: boolean,
	options: BaseChartProps[ 'options' ] = {},
	isSeriesRendered: ( series: SeriesData ) => boolean = ALL_RENDERED
) {
	// Callers reasonably pass an object literal, which is a fresh reference every
	// render and would defeat every memo below.
	const stableOptions = useDeepMemo( options );

	// `labelOverflow` and `tickResolution` are consumed by this hook rather than
	// forwarded — visx has an axis prop for neither — and `tickFormat` is merged
	// with the derived default explicitly, so an `undefined` passed by a caller
	// cannot clobber it through the spread. They are split off the caller's axis
	// options once, here, and only the rest reaches visx below.
	const axisConfig = useMemo( () => {
		const {
			labelOverflow: xLabelOverflow,
			tickResolution: xTickResolution,
			tickFormat: xTickFormat,
			...xAxisOptions
		} = stableOptions.axis?.x || {};
		const {
			labelOverflow: yLabelOverflow,
			tickResolution: yTickResolution,
			tickFormat: yTickFormat,
			...yAxisOptions
		} = stableOptions.axis?.y || {};

		return {
			xLabelOverflow,
			yLabelOverflow,
			xTickFormat,
			yTickFormat,
			xAxisOptions,
			yAxisOptions,
			// The dates sit on the x axis normally, and on the y axis when the
			// chart is horizontal, so the hint follows them.
			tickResolution: horizontal ? yTickResolution : xTickResolution,
		};
	}, [ stableOptions, horizontal ] );
	const { tickResolution } = axisConfig;

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

		// Ticks on a date-based series share the line/area charts' time-axis
		// formatter, which narrows with the overall span as well as the bucket
		// size; the tooltip stays at the bucket's own granularity.
		const hasLabels = Boolean( data?.[ 0 ]?.data?.[ 0 ]?.label );
		const timeTickFormatter = hasLabels ? null : getFormatter( data, tickResolution );
		const labelFormatter = timeTickFormatter ? byBucket( timeTickFormatter ) : identity;
		const tooltipDatumFormatter = hasLabels
			? labelFormatter
			: byBucket( getTooltipFormatter( data, tickResolution ) );
		const valueFormatter = formatNumberCompact as TickFormatter< unknown >;

		const bandDomain = timeTickFormatter ? getBandDomain( data, isSeriesRendered ) : null;

		const valueAccessor = ( d: DataPointDate | EnhancedDataPoint ) => {
			// Use visualValue for bar rendering if available (for zero values), otherwise use value
			const enhancedPoint = d as EnhancedDataPoint;
			return enhancedPoint?.visualValue !== undefined ? enhancedPoint.visualValue : d?.value;
		};

		return {
			timeAxis: bandDomain &&
				timeTickFormatter && {
					domain: bandDomain,
					tickFormatter: timeTickFormatter,
				},
			vertical: {
				xTickFormat: labelFormatter,
				yTickFormat: valueFormatter,
				tooltipLabelFormatter: tooltipDatumFormatter,
				xAccessor: bucketAccessor,
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
				yAccessor: bucketAccessor,
				gridVisibility: 'y',
				xScale: linearScale,
				yScale: bandScale,
			},
		};
	}, [ data, tickResolution, isSeriesRendered ] );

	return useMemo( () => {
		const orientationKey = horizontal ? 'horizontal' : 'vertical';
		const {
			xTickFormat: defaultXTickFormat,
			yTickFormat: defaultYTickFormat,
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
			const userDomain = valueAxisIsY ? stableOptions.yScale?.domain : stableOptions.xScale?.domain;
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
			...( stableOptions.xScale || {} ),
			...( horizontal ? valueScaleDomainOverride : {} ),
		};
		const yScale = {
			...baseYScale,
			...( stableOptions.yScale || {} ),
			...( ! horizontal ? valueScaleDomainOverride : {} ),
		};
		const { xLabelOverflow, yLabelOverflow, xTickFormat, yTickFormat, xAxisOptions, yAxisOptions } =
			axisConfig;
		// The dates sit on the y axis of a horizontal chart, so the caller's format
		// for them moves with the orientation. It also labels the tooltip.
		const dateAxisTickFormat = horizontal ? yTickFormat : xTickFormat;

		// A band scale has no ticks of its own for visx to ask for, so it samples
		// the domain by index and can miss the tick that dates the day or names the
		// year. Pick the values here instead. Only for our own formatter — a
		// caller's `tickFormat` may not be the one these values were chosen for.
		const { timeAxis } = defaultOptions;
		const dateAxisOptions = horizontal ? yAxisOptions : xAxisOptions;
		const bandTickValues =
			timeAxis && ! dateAxisTickFormat
				? getBandTickValues(
						timeAxis.domain,
						timeAxis.tickFormatter,
						dateAxisOptions.numTicks ?? DEFAULT_NUM_TICKS
				  )
				: null;
		const dateAxisTickValues = bandTickValues ? { tickValues: bandTickValues } : {};

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
					numTicks: DEFAULT_NUM_TICKS,
					tickFormat: xTickFormat || defaultXTickFormat,
					...( horizontal ? {} : dateAxisTickValues ),
					...( xLabelOverflow === 'ellipsis' ? { tickComponent: TruncatedXTickComponent } : {} ),
					...xAxisOptions,
				},
				y: {
					orientation: 'left' as const,
					numTicks: DEFAULT_NUM_TICKS,
					tickFormat: yTickFormat || defaultYTickFormat,
					...( horizontal ? dateAxisTickValues : {} ),
					...( yLabelOverflow === 'ellipsis' ? { tickComponent: TruncatedYTickComponent } : {} ),
					...yAxisOptions,
				},
			},
			barGroup: {
				padding: getGroupPadding( horizontal ? yScale : xScale ),
			},
			tooltip: {
				labelFormatter: dateAxisTickFormat || defaultTooltipLabelFormatter,
			},
		};
	}, [ defaultOptions, axisConfig, stableOptions, horizontal, data ] );
}
