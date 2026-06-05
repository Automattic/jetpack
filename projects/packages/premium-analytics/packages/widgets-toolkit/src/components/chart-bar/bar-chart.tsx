/**
 * External dependencies
 */
import { BarChart as BarChartBase } from '@automattic/charts';
import { Icon } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useId } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { isEmptyChartData, getEmptyChartDomain } from '../../helpers';
import { ChartEmptyState } from '../chart-empty-state';
import { ChartTooltip } from '../chart-tooltip';
import styles from './bar-chart.module.scss';
import type { DataFormat } from '../../types';
import type { ComponentProps } from 'react';

export type BarChartData = ComponentProps< typeof BarChartBase >[ 'data' ];

/**
 * Inferred types from BarChart (BarChartBase)
 */
type BarChartBaseProps = ComponentProps< typeof BarChartBase >;
type RenderTooltipParams = Parameters< NonNullable< BarChartBaseProps[ 'renderTooltip' ] > >[ 0 ];

/**
 * Style configuration for bar chart.
 */
export type BarChartStyle = {
	/** Bar fill color */
	stroke: string;
};

export type BarChartProps = {
	/**
	 * Chart data (series with data points).
	 * Colors can be provided via chartData[].options.stroke.
	 */
	chartData: BarChartData;

	/**
	 * Format configuration for chart values (tooltips)
	 */
	dataFormat: DataFormat;

	/**
	 * Explicit styles for bars. When provided, these take priority
	 * over styles defined in chartData[].options.stroke.
	 */
	styles?: BarChartStyle[];

	/**
	 * Optional className for the container
	 */
	className?: string;

	/**
	 * Icon to display in the empty state
	 */
	emptyStateIcon?: React.ComponentProps< typeof Icon >[ 'icon' ];

	/**
	 * Text to display in the empty state
	 */
	emptyStateText?: string;

	/**
	 * Whether to show a thin bar for zero values when the chart is rendered.
	 * When true and the data is not considered empty, zero-value bars render
	 * with a small visible height so users have something to hover over for
	 * tooltips. When all values are 0 or null and the chart is treated as
	 * empty, an empty state is shown instead and this option has no effect.
	 * @default true
	 */
	showZeroValues?: boolean;
};

/**
 * Resolves bar styles from either the explicit styles prop or series options.
 * Priority: styles prop > chartData[].options.stroke fallback
 *
 * @param stylesFromProp - Explicit styles from component prop
 * @param chartData      - Chart data with optional stroke colors
 * @return Array of resolved styles, one per series
 */
function resolveSeriesStyles(
	stylesFromProp: BarChartStyle[] | undefined,
	chartData: BarChartData
): BarChartStyle[] {
	// If styles prop is provided, use it directly
	if ( stylesFromProp?.length ) {
		return stylesFromProp;
	}

	// Fallback: extract styles from chartData options
	return (
		chartData?.map( series => ( {
			stroke: series.options?.stroke ?? 'currentColor',
		} ) ) ?? [ { stroke: 'currentColor' } ]
	);
}

/**
 * Applies resolved styles to chart data for the internal BarChart.
 * Sets options.stroke on each series.
 *
 * @param chartData      - Original chart data
 * @param resolvedStyles - Styles to apply
 * @return Chart data with styles applied to options
 */
function applyStylesToSeries(
	chartData: BarChartData,
	resolvedStyles: BarChartStyle[]
): BarChartData {
	return chartData.map( ( seriesItem, index ) => {
		const style = resolvedStyles[ index ] ?? resolvedStyles[ 0 ];

		if ( ! style?.stroke ) {
			return seriesItem;
		}

		return {
			...seriesItem,
			options: {
				...( seriesItem.options ?? {} ),
				stroke: style.stroke,
			},
		};
	} );
}

/**
 * Pure BarChart component.
 * Does not depend on any context provider - all data flows through props.
 *
 * Colors can be provided via chartData[].options.stroke or via styles prop.
 * Uses RectShape from chart library for tooltip indicators.
 */
export function BarChart( {
	chartData,
	dataFormat,
	styles: stylesProp,
	className,
	emptyStateIcon,
	emptyStateText,
	showZeroValues = true,
}: BarChartProps ) {
	const chartId = useId();

	/**
	 * Resolve styles: prop takes priority, fallback to chartData options.
	 * This array is used for tooltip styling and to decorate chart data.
	 */
	const resolvedStyles = useMemo< BarChartStyle[] >(
		() => resolveSeriesStyles( stylesProp, chartData ),
		[ stylesProp, chartData ]
	);

	/**
	 * Apply resolved styles to chart data for the internal BarChart.
	 * Only needed when styles come from prop; otherwise chartData already has styles.
	 */
	const styledChartData = useMemo( () => {
		// If no styles prop, chartData already has its styles in options
		if ( ! stylesProp?.length ) {
			return chartData;
		}
		return applyStylesToSeries( chartData, resolvedStyles );
	}, [ stylesProp, chartData, resolvedStyles ] );

	/**
	 * Detect if chart data is empty (all values are 0).
	 * Used to disable tooltips when there's no meaningful data to display.
	 */
	const isEmptyData = useMemo( () => isEmptyChartData( styledChartData ), [ styledChartData ] );

	/**
	 * Chart options for empty data state.
	 * Sets a fixed Y-axis domain so the chart shows 0 at the bottom
	 * with meaningful tick values instead of a flat line.
	 */
	const chartOptions = useMemo( () => {
		if ( ! isEmptyData ) {
			return {
				// Apply ellipsis to x-axis labels when they overflow.
				axis: {
					x: {
						labelOverflow: 'ellipsis' as const,
					},
				},
			};
		}

		const domain = getEmptyChartDomain( dataFormat.type );
		return {
			yScale: { domain },
		};
	}, [ isEmptyData, dataFormat.type ] );

	const getTooltipLabel = useCallback(
		( datum: { label: string }, _index: number, key: string ): string => {
			if ( key ) {
				// Show the key (typically the date range label) in the tooltip if available,
				// since the bar's label is already shown on the x-axis. This helps distinguish
				// between current period and comparison period bars in tooltips.
				return key;
			}
			return datum.label;
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
					indicatorType="rect"
					getLabel={ getTooltipLabel }
				/>
			);
		},
		[ dataFormat, resolvedStyles, getTooltipLabel ]
	);

	if ( isEmptyData ) {
		return <ChartEmptyState icon={ emptyStateIcon } text={ emptyStateText } />;
	}

	return (
		<BarChartBase
			chartId={ chartId }
			data={ styledChartData }
			className={ clsx( styles.chart, className ) }
			resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
			showLegend={ false }
			withTooltips={ ! isEmptyData }
			renderTooltip={ renderTooltip }
			options={ chartOptions }
			showZeroValues={ showZeroValues }
		>
			<BarChartBase.Legend
				shape="circle"
				className={ styles.legend }
				itemClassName={ styles.legendItem }
				labelClassName={ styles.legendLabel }
				labelStyles={ {
					maxWidth: '100%',
					textOverflow: 'ellipsis',
					margin: 0,
				} }
				shapeStyles={ {
					width: 8,
					height: 8,
					margin: 0,
				} }
			/>
		</BarChartBase>
	);
}
