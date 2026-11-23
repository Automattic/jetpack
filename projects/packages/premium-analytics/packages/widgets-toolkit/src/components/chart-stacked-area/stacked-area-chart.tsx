/**
 * External dependencies
 */
import { AreaChart, Stack, getBucketInfo } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import {
	formatBucketTooltipDate,
	getYTickDecimals,
	getYTickFormat,
	isEmptyChartData,
	toTickResolution,
} from '../../helpers';
import { useChartName } from '../../hooks/use-chart-name';
import { useSeriesStyles } from '../../hooks/use-series-styles';
import { DatedTooltip, buildDatedTooltipModel } from '../chart-tooltip';
import styles from './stacked-area-chart.module.scss';
import type { BucketResolution } from '../../helpers';
import type { DataFormat } from '../../types';
import type {
	ComparativeDatePointDate,
	ComparativeLineChartSeries,
} from '../chart-comparative-line/types';
import type { ComponentProps } from 'react';

/** Light enough for each part's outline to carry its color, as the chart's lines do elsewhere. */
const AREA_FILL_OPACITY = 0.25;

type AreaChartProps = ComponentProps< typeof AreaChart >;
type RenderTooltipParams = Parameters< NonNullable< AreaChartProps[ 'renderTooltip' ] > >[ 0 ];

export type StackedAreaChartProps = {
	/** The parts of one total, bottom of the stack first; `options.stroke` colors a part. */
	series: ComparativeLineChartSeries[];

	className?: string;

	/** What the chart shows, when that is not the widget title; the chart is named "Chart: <title>". */
	chartTitle?: string;

	dataFormat: DataFormat;

	/** The series' bucket size, for the tick labels and the tooltip's date. */
	tickResolution?: BucketResolution;

	/** Drop the axes and grid while the chart is shorter than `theme.compactWhenShort.below`. */
	compactWhenShort?: boolean;
};

/**
 * Series stacked into one total over time. It draws no legend: the parts are few
 * and fixed, so the widget names them beside their totals.
 *
 * @param {StackedAreaChartProps} props - The component props.
 * @return The rendered chart.
 */
export function StackedAreaChart( {
	series,
	className,
	chartTitle,
	dataFormat,
	tickResolution,
	compactWhenShort = false,
}: StackedAreaChartProps ) {
	const chartName = useChartName( chartTitle );
	const libraryTickResolution = toTickResolution( tickResolution );
	const { displayResolution } = getBucketInfo( series, libraryTickResolution );
	const seriesStyles = useSeriesStyles( series );

	const formatTooltipBucket = useCallback(
		( point: ComparativeDatePointDate ) =>
			formatBucketTooltipDate( point, displayResolution, tickResolution ),
		[ displayResolution, tickResolution ]
	);

	const renderTooltip = useCallback(
		( params: RenderTooltipParams ) => {
			const model = buildDatedTooltipModel( {
				tooltipData: params.tooltipData,
				series,
				seriesStyles,
				dataFormat,
				formatDate: formatTooltipBucket,
			} );

			return model && <DatedTooltip model={ model } indicatorType="line" />;
		},
		[ dataFormat, seriesStyles, series, formatTooltipBucket ]
	);

	const isEmptyData = useMemo( () => isEmptyChartData( series ), [ series ] );
	const currencyCode = dataFormat.options?.currencyCode;
	// The chart sizes its axis gutter from single values unless the domain is
	// pinned, which clips the label of a stack's total.
	const stackedMax = useMemo( () => {
		const totals = new Map< number, number >();
		for ( const { data } of series ) {
			for ( const point of data ) {
				const time = point.date.getTime();
				totals.set( time, ( totals.get( time ) ?? 0 ) + ( point.value ?? 0 ) );
			}
		}
		return Math.max( 0, ...totals.values() );
	}, [ series ] );
	const chartOptions = useMemo(
		() => ( {
			...( stackedMax > 0 ? { yScale: { domain: [ 0, stackedMax ] as [ number, number ] } } : {} ),
			axis: {
				x: { tickResolution: libraryTickResolution },
				y: {
					tickFormat: getYTickFormat( dataFormat.type, undefined, currencyCode ),
					tickDecimals: getYTickDecimals( dataFormat.type, currencyCode ),
				},
			},
		} ),
		[ libraryTickResolution, dataFormat.type, currencyCode, stackedMax ]
	);

	return (
		<Stack direction="column" className={ clsx( styles.chart, className ) }>
			<AreaChart
				ariaLabel={ chartName }
				className={ styles.chartContent }
				data={ series }
				options={ chartOptions }
				maxWidth={ Infinity }
				compactWhenShort={ compactWhenShort }
				resizeDebounceTime={ RESIZE_DEBOUNCE_MS }
				stacked
				fillOpacity={ AREA_FILL_OPACITY }
				withStroke
				curveType="monotone"
				showLegend={ false }
				withTooltips={ ! isEmptyData }
				renderTooltip={ renderTooltip }
			/>
		</Stack>
	);
}
