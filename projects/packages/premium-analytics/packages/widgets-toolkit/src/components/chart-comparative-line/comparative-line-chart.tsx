/**
 * External dependencies
 */
import { LineChart } from '@automattic/charts';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { isEmptyChartData, getEmptyChartDomain } from '../../helpers';
import { ChartTooltip } from '../chart-tooltip';
import styles from './comparative-line-chart.module.scss';
import { alignSeriesDates } from './utils';
import type { ComparativeLineChartSeries, SeriesStyle } from './types';
import type { DataFormat } from '../../types';

/**
 * Resolves series styles from either the explicit styles prop or series options.
 * Priority: styles prop > series[].options fallback
 *
 * @param stylesFromProp - Explicit styles passed as component prop
 * @param series         - Series data (may contain options with styles)
 * @return Array of resolved styles, one per series
 */
function resolveSeriesStyles(
	stylesFromProp: SeriesStyle[] | undefined,
	series: ComparativeLineChartSeries[]
): SeriesStyle[] {
	// If styles prop is provided, use it directly
	if ( stylesFromProp?.length ) {
		return stylesFromProp;
	}

	// Fallback: extract styles from series options
	return series.map( s => {
		const lineStyle = s.options?.seriesLineStyle;

		return {
			stroke: s.options?.stroke ?? '',
			strokeWidth: lineStyle?.strokeWidth,
			strokeDasharray: lineStyle?.strokeDasharray,
			strokeLinecap: lineStyle?.strokeLinecap,
			strokeLinejoin: lineStyle?.strokeLinejoin,
			opacity: lineStyle?.opacity,
		};
	} );
}

/**
 * Default margin for charts.
 * Y-axis is on the left, so right margin is always 0.
 */
const DEFAULT_MARGIN = { right: 0 };

/**
 * Chart-area height (px) below which `compactWhenShort` degrades the chart to
 * a sparkline (no y-axis, grid, or legend).
 */
const COMPACT_CHART_HEIGHT = 140;

/**
 * Applies resolved styles to series data for the internal LineChart.
 * Sets options.stroke and options.seriesLineStyle on each series.
 *
 * @param series         - Original series data
 * @param resolvedStyles - Styles to apply
 * @return Series with styles applied to options
 */
function applyStylesToSeries(
	series: ComparativeLineChartSeries[],
	resolvedStyles: SeriesStyle[]
): ComparativeLineChartSeries[] {
	return series.map( ( seriesItem, index ) => {
		const style = resolvedStyles[ index ] ?? resolvedStyles[ 0 ];

		if ( ! style?.stroke ) {
			return seriesItem;
		}

		const { stroke, ...lineStyleProps } = style;

		return {
			...seriesItem,
			options: {
				...( seriesItem.options ?? {} ),
				stroke,
				seriesLineStyle: lineStyleProps,
			},
		};
	} );
}

/**
 * Inferred types
 */
type LineChartProps = ComponentProps< typeof LineChart >;
type RenderTooltipParams = Parameters< NonNullable< LineChartProps[ 'renderTooltip' ] > >[ 0 ];

/**
 * Props for the ComparativeLineChart component.
 *
 * Combines series data with chart options, formatting, and responsive behavior.
 * Wraps @automattic/charts LineChart with sensible defaults for comparative data visualization.
 *
 * Note: The chart defaults to margin.right = 0 since the Y-axis is positioned on the left.
 */
export type ComparativeLineChartProps = {
	/**
	 * Array of series data to display in the chart.
	 * Series can include styling via options.stroke and options.seriesLineStyle
	 * as a fallback when styles prop is not provided.
	 */
	series: ComparativeLineChartSeries[];

	/**
	 * Explicit styles for each series. When provided, these take priority
	 * over any styles defined in series[].options.
	 * Array index corresponds to series index.
	 */
	styles?: SeriesStyle[];

	/**
	 * CSS class for the chart container
	 */
	className?: string;

	/**
	 * Format configuration for chart values (Y-axis ticks and tooltips)
	 */
	dataFormat: DataFormat;

	tickFormat?: string;

	/**
	 * Degrade to a sparkline (no y-axis, grid, or legend) when the chart area
	 * is too short for readable axis labels. Defaults to false.
	 */
	compactWhenShort?: boolean;
} & Omit<
	ComponentProps< typeof LineChart >,
	| 'data'
	| 'options'
	| 'withLegendGlyph'
	| 'smoothing'
	| 'showLegend'
	| 'withGradientFill'
	| 'resizeDebounceTime'
	| 'withTooltips'
	| 'renderTooltip'
>;

export function ComparativeLineChart( {
	series,
	styles: stylesProp,
	className,
	dataFormat,
	tickFormat: xTickFormatType,
	maxWidth = Infinity,
	compactWhenShort = false,
}: ComparativeLineChartProps ) {
	// The measured Stack fills its container (flex), so its height is independent
	// of whether the axis/legend are shown — no measure/hide feedback loop.
	const [ chartAreaHeight, setChartAreaHeight ] = useState( Infinity );
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			setChartAreaHeight( rect.height );
		}
	} );
	const isCompact = compactWhenShort && chartAreaHeight < COMPACT_CHART_HEIGHT;
	/**
	 * Resolve styles: prop takes priority, fallback to series options.
	 * This array is used for tooltip styling and to decorate series data.
	 */
	const resolvedStyles = useMemo< SeriesStyle[] >(
		() => resolveSeriesStyles( stylesProp, series ),
		[ stylesProp, series ]
	);

	/**
	 * Custom label extractor for line chart datum.
	 * Uses realDate for comparison series to show the actual date.
	 *
	 * @param datum - The data point with date information
	 * @param index - Index of this entry in the tooltip
	 */
	const getTooltipLabel = useCallback(
		( datum: { date: Date; realDate?: Date }, index: number ): string => {
			const isComparison = index > 0;
			const displayDate = isComparison ? datum.realDate ?? datum.date : datum.date;
			return formatDate( displayDate );
		},
		[]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			return (
				<ChartTooltip
					tooltipData={ params.tooltipData }
					dataFormat={ dataFormat }
					seriesStyles={ resolvedStyles }
					indicatorType="line"
					getLabel={ getTooltipLabel }
				/>
			);
		},
		[ dataFormat, resolvedStyles, getTooltipLabel ]
	);

	/**
	 * Y-axis formatter using dataFormat configuration,
	 * but using multipliers and 0 decimals to keep strings short and concise.
	 */
	const yTickFormat = useMemo(
		() => ( value: number ) =>
			formatMetricValue( value, dataFormat.type, {
				useMultipliers: true,
				decimals: 0,
			} ),
		[ dataFormat ]
	);

	/**
	 * Creates margin object for fixed domain charts.
	 * The chart library doesn't auto-adjust left margin for fixed domains,
	 * so we estimate based on the formatted max value length.
	 */
	const createDomainMargin = useCallback(
		( maxValue: number ) => ( {
			...DEFAULT_MARGIN,
			left: yTickFormat( maxValue ).length * 10,
		} ),
		[ yTickFormat ]
	);

	/**
	 * Align comparison series dates to primary series for X-axis display.
	 * Original dates are preserved in realDate for tooltip display.
	 */
	const alignedSeries = useMemo( () => alignSeriesDates( series ), [ series ] );

	/**
	 * Apply resolved styles to series data for the internal LineChart.
	 * Only needed when styles come from prop; otherwise series already have styles.
	 */
	const styledSeries = useMemo( () => {
		// If no styles prop, series already have their styles in options
		if ( ! stylesProp?.length ) {
			return alignedSeries;
		}
		return applyStylesToSeries( alignedSeries, resolvedStyles );
	}, [ stylesProp, alignedSeries, resolvedStyles ] );

	/**
	 * Detect if chart data is empty and apply special props for empty state
	 */
	const isEmptyData = useMemo( () => isEmptyChartData( styledSeries ), [ styledSeries ] );

	/**
	 * For percentage metrics, always use a fixed domain [0, 1.0] (0% to 100%)
	 * regardless of actual data values or empty state
	 */
	const percentageDomain: [ number, number ] | null = useMemo( () => {
		return dataFormat.type === 'percentage' ? [ 0, 1.0 ] : null;
	}, [ dataFormat.type ] );

	const emptyChartProps = useMemo( () => {
		if ( ! isEmptyData ) {
			return {};
		}

		const domain = getEmptyChartDomain( dataFormat.type );

		return {
			chartOptions: { yScale: { domain } },
			margin: createDomainMargin( domain[ 1 ] ),
		};
	}, [ isEmptyData, dataFormat.type, createDomainMargin ] );

	/**
	 * Calculate margin for percentage charts
	 */
	const percentageMargin = useMemo( () => {
		if ( ! percentageDomain ) {
			return undefined;
		}
		return createDomainMargin( percentageDomain[ 1 ] );
	}, [ percentageDomain, createDomainMargin ] );

	const xTickFormat = useCallback(
		( date: number ) => formatDate( date, xTickFormatType ?? 'short' ),
		[ xTickFormatType ]
	);

	/**
	 * Merge chart options with empty chart options if data is empty
	 * For percentage metrics, always apply fixed domain
	 */
	const chartOptions = useMemo( () => {
		const baseOptions = {
			axis: {
				x: {
					// Use the chart library's default behavior for 'custom' presets
					tickFormat: xTickFormatType ? xTickFormat : undefined,
				},
				y: {
					tickFormat: yTickFormat,
					// Hide the y-axis on short tiles; its labels would otherwise overlap.
					...( isCompact ? { display: false } : {} ),
				},
			},
		};

		// Apply percentage domain if applicable
		if ( percentageDomain ) {
			return {
				...baseOptions,
				yScale: { domain: percentageDomain },
			};
		}

		if ( ! isEmptyData ) {
			return baseOptions;
		}

		// Merge with empty chart options
		return {
			...baseOptions,
			...emptyChartProps.chartOptions,
		};
	}, [
		xTickFormat,
		xTickFormatType,
		yTickFormat,
		percentageDomain,
		isEmptyData,
		emptyChartProps.chartOptions,
		isCompact,
	] );

	const margin = percentageMargin ?? emptyChartProps.margin ?? DEFAULT_MARGIN;

	return (
		<Stack ref={ measureRef } direction="column" className={ clsx( styles.chart, className ) }>
			<LineChart
				className={ styles.chartContent }
				data={ styledSeries }
				options={ chartOptions }
				// With the y-axis hidden, reclaim its reserved left margin for the line.
				margin={ isCompact ? { ...margin, left: 0 } : margin }
				maxWidth={ maxWidth }
				gridVisibility={ isCompact ? 'none' : undefined }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				withLegendGlyph={ false }
				showLegend={ false }
				curveType="monotone"
				withGradientFill
				withTooltips={ !! renderTooltip && ! isEmptyData }
				renderTooltip={ renderTooltip }
			>
				{ /* The solid/dashed lines already convey current vs previous period. */ }
				{ ! isCompact && (
					<LineChart.Legend
						shape="line"
						className={ styles.legend }
						itemClassName={ styles.legendItem }
						itemStyles={ {
							margin: 0,
						} }
						labelClassName={ styles.legendLabel }
						labelStyles={ {
							maxWidth: '100%',
							textOverflow: 'ellipsis',
							margin: 0,
						} }
						shapeStyles={ { margin: 0 } }
					/>
				) }
			</LineChart>
		</Stack>
	);
}
