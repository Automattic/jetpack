import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { SelectControl, Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import { formatWatchTime } from '../../utils/format';
import type { ActiveMetric, ChartCompare, Granularity, StatsSeriesPoint } from '../../types/stats';
import type { LineChartProps } from '@automattic/charts';
import type { ReactElement, ReactNode } from 'react';

type Props = {
	series: StatsSeriesPoint[];
	activeMetric: ActiveMetric;
	compare: ChartCompare;
	granularity: Granularity;
	isLoading: boolean;
	onChangeCompare: ( next: ChartCompare ) => void;
	onChangeGranularity: ( next: Granularity ) => void;
	panelId: string;
	activeTabId: string;
};

const CHART_HEIGHT = 240;

type MetricConfig = {
	title: string;
	primaryLabel: string;
	primaryField: keyof Pick< StatsSeriesPoint, 'views' | 'impressions' | 'watchTimeSeconds' >;
	primaryPrevField: keyof Pick<
		StatsSeriesPoint,
		'previousPeriodViews' | 'previousPeriodImpressions' | 'previousPeriodWatchTimeSeconds'
	>;
	secondary: { label: string; field: 'views' | 'impressions' } | null;
	yTickFormat?: ( value: number ) => string;
};

const METRIC_CONFIG: Record< ActiveMetric, MetricConfig > = {
	views: {
		title: __( 'Views trends', 'jetpack-videopress-pkg' ),
		primaryLabel: __( 'Views', 'jetpack-videopress-pkg' ),
		primaryField: 'views',
		primaryPrevField: 'previousPeriodViews',
		secondary: { label: __( 'Impressions', 'jetpack-videopress-pkg' ), field: 'impressions' },
	},
	impressions: {
		title: __( 'Impressions trends', 'jetpack-videopress-pkg' ),
		primaryLabel: __( 'Impressions', 'jetpack-videopress-pkg' ),
		primaryField: 'impressions',
		primaryPrevField: 'previousPeriodImpressions',
		secondary: { label: __( 'Views', 'jetpack-videopress-pkg' ), field: 'views' },
	},
	watch_time: {
		title: __( 'Watch time trends', 'jetpack-videopress-pkg' ),
		primaryLabel: __( 'Watch time', 'jetpack-videopress-pkg' ),
		primaryField: 'watchTimeSeconds',
		primaryPrevField: 'previousPeriodWatchTimeSeconds',
		secondary: null,
		yTickFormat: formatWatchTime,
	},
};

const COMPARE_OPTIONS_BY_METRIC: Record< ActiveMetric, { label: string; value: ChartCompare }[] > =
	{
		views: [
			{ label: __( 'vs impressions', 'jetpack-videopress-pkg' ), value: 'secondary' },
			{ label: __( 'vs previous period', 'jetpack-videopress-pkg' ), value: 'previous_period' },
			{
				label: __( 'vs impressions / previous period', 'jetpack-videopress-pkg' ),
				value: 'secondary_and_previous_period',
			},
		],
		impressions: [
			{ label: __( 'vs views', 'jetpack-videopress-pkg' ), value: 'secondary' },
			{ label: __( 'vs previous period', 'jetpack-videopress-pkg' ), value: 'previous_period' },
			{
				label: __( 'vs views / previous period', 'jetpack-videopress-pkg' ),
				value: 'secondary_and_previous_period',
			},
		],
		watch_time: [
			{ label: __( 'vs previous period', 'jetpack-videopress-pkg' ), value: 'previous_period' },
		],
	};

const GRANULARITY_OPTIONS: { label: string; value: Granularity }[] = [
	{ label: __( 'Days', 'jetpack-videopress-pkg' ), value: 'days' },
	{ label: __( 'Weeks', 'jetpack-videopress-pkg' ), value: 'weeks' },
	{ label: __( 'Months', 'jetpack-videopress-pkg' ), value: 'months' },
];

const NUMBER_FORMATTER = new Intl.NumberFormat();

/**
 * Format a tooltip value with the unit matching the chart's active metric.
 * Mirrors the KPI row's `formatWatchTime` / `Intl.NumberFormat` split so the
 * tooltip never disagrees with the y-axis (the LineChart default tooltip
 * uses `formatNumber` regardless of `axis.y.tickFormat`, which is why
 * Watch time previously showed thousands of seconds while the axis showed
 * minutes / hours).
 *
 * @param value  - Raw datum value.
 * @param metric - Active chart metric.
 * @return Formatted value string for the tooltip cell.
 */
function formatTooltipValue( value: number, metric: ActiveMetric ): string {
	if ( metric === 'watch_time' ) {
		return formatWatchTime( value );
	}
	return NUMBER_FORMATTER.format( value );
}

type ChartTooltipParams = Parameters< NonNullable< LineChartProps[ 'renderTooltip' ] > >[ 0 ];

type ChartSeries = { label: string; data: { date: Date; value: number }[] };

/**
 * Build the chart's series list from the active stats series, the
 * active metric, and the compare selection. The active metric's primary
 * series is always present; the secondary metric's series appears when
 * `compare` includes it (and only for metrics that have a secondary);
 * the active metric's previous-period series appears when `compare`
 * includes it.
 *
 * @param series       - Active range's series points.
 * @param activeMetric - Currently selected chart metric.
 * @param compare      - Active compare selection.
 * @return Series list consumable by `@automattic/charts` LineChart.
 */
function buildSeriesData(
	series: StatsSeriesPoint[],
	activeMetric: ActiveMetric,
	compare: ChartCompare
): ChartSeries[] {
	const config = METRIC_CONFIG[ activeMetric ];
	const out: ChartSeries[] = [
		{
			label: config.primaryLabel,
			data: series.map( p => ( {
				date: new Date( p.date ),
				value: p[ config.primaryField ],
			} ) ),
		},
	];
	if ( config.secondary && compare !== 'previous_period' ) {
		const secondary = config.secondary;
		out.push( {
			label: secondary.label,
			data: series.map( p => ( {
				date: new Date( p.date ),
				value: p[ secondary.field ],
			} ) ),
		} );
	}
	if ( compare !== 'secondary' ) {
		out.push( {
			label: __( 'Previous period', 'jetpack-videopress-pkg' ),
			data: series.map( p => ( {
				date: new Date( p.date ),
				value: p[ config.primaryPrevField ],
			} ) ),
		} );
	}
	return out;
}

/**
 * Trends card for the metric selected in the KPI row. Renders the
 * card title, optional compare and granularity selectors, and a
 * `@automattic/charts` LineChart whose primary series, comparison
 * options, and y-axis formatting all derive from `activeMetric`.
 *
 * @param props                     - Component props.
 * @param props.series              - Series points for the active range.
 * @param props.activeMetric        - Currently selected chart metric.
 * @param props.compare             - Currently selected compare.
 * @param props.granularity         - Currently selected granularity.
 * @param props.isLoading           - When true, the chart canvas is left blank but reserves height so the page does not reflow when data arrives.
 * @param props.onChangeCompare     - Called with the next compare value.
 * @param props.onChangeGranularity - Called with the next granularity.
 * @param props.panelId             - Stable DOM id for the card; KPI tabs reference it via `aria-controls`.
 * @param props.activeTabId         - Id of the currently active KPI tab; sets the panel's `aria-labelledby`.
 * @return The card element.
 */
export default function ViewsTrendsCard( {
	series,
	activeMetric,
	compare,
	granularity,
	isLoading,
	onChangeCompare,
	onChangeGranularity,
	panelId,
	activeTabId,
}: Props ): ReactElement {
	const config = METRIC_CONFIG[ activeMetric ];
	const compareOptions = COMPARE_OPTIONS_BY_METRIC[ activeMetric ];

	// Memoize data so the chart doesn't see new array/object identities on
	// every parent render — that re-triggers the chart's internal hooks
	// (legend registration, scale computation, …), which feeds back as
	// further parent renders and visibly grows the y-axis until the lines
	// flatten to invisibility.
	const chartData = useMemo(
		() => buildSeriesData( series, activeMetric, compare ),
		[ series, activeMetric, compare ]
	);

	const chartOptions = useMemo(
		() => ( config.yTickFormat ? { axis: { y: { tickFormat: config.yTickFormat } } } : undefined ),
		[ config.yTickFormat ]
	);

	// LineChart's default tooltip renders a light card and formats values
	// with `formatNumber`, ignoring `axis.y.tickFormat`. We provide our own
	// so (a) Watch time tooltips read in the same unit as the axis ticks
	// ("12 min", not "720"), and (b) the surface is dark to match the
	// WordPress DS tooltip (https://wordpress.github.io/gutenberg/?path=/story/design-system-components-tooltip--default).
	const renderTooltip = useCallback(
		( params: ChartTooltipParams ): ReactNode => {
			const nearestDatum = params.tooltipData?.nearestDatum?.datum;
			if ( ! nearestDatum ) {
				return null;
			}
			const points = Object.entries( params.tooltipData?.datumByKey ?? {} )
				.map( ( [ key, entry ] ) => ( {
					key,
					value: ( entry.datum as { value: number } ).value,
				} ) )
				.sort( ( a, b ) => b.value - a.value );
			const date = ( nearestDatum as { date?: Date } ).date;
			return (
				<div className="vp-overview__chart-tooltip">
					{ date && (
						<div className="vp-overview__chart-tooltip-date">{ date.toLocaleDateString() }</div>
					) }
					{ points.map( point => (
						<Stack
							key={ point.key }
							direction="row"
							align="center"
							justify="space-between"
							className="vp-overview__chart-tooltip-row"
						>
							<span className="vp-overview__chart-tooltip-label">{ point.key }:</span>
							<span className="vp-overview__chart-tooltip-value">
								{ formatTooltipValue( point.value, activeMetric ) }
							</span>
						</Stack>
					) ) }
				</div>
			);
		},
		[ activeMetric ]
	);

	const onCompareSelect = useCallback(
		( next: string ) => onChangeCompare( next as ChartCompare ),
		[ onChangeCompare ]
	);
	const onGranularitySelect = useCallback(
		( next: string ) => onChangeGranularity( next as Granularity ),
		[ onChangeGranularity ]
	);

	return (
		<Card.Root id={ panelId } role="tabpanel" aria-labelledby={ activeTabId } tabIndex={ 0 }>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center">
					<Card.Title>{ config.title }</Card.Title>
					<Stack direction="row" gap="sm">
						{ compareOptions.length > 1 && (
							<SelectControl
								__nextHasNoMarginBottom
								label={ __( 'Compare', 'jetpack-videopress-pkg' ) }
								hideLabelFromVision
								value={ compare }
								options={ compareOptions }
								onChange={ onCompareSelect }
							/>
						) }
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Granularity', 'jetpack-videopress-pkg' ) }
							hideLabelFromVision
							value={ granularity }
							options={ GRANULARITY_OPTIONS }
							onChange={ onGranularitySelect }
						/>
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content>
				<div className="vp-overview__chart-frame" style={ { height: CHART_HEIGHT } }>
					{ isLoading ? (
						<div className="vp-overview__chart-spinner" aria-hidden="true">
							<Spinner />
						</div>
					) : (
						<LineChart
							data={ chartData }
							showLegend
							withGradientFill={ false }
							curveType="monotone"
							height={ CHART_HEIGHT }
							options={ chartOptions }
							renderTooltip={ renderTooltip }
						/>
					) }
				</div>
			</Card.Content>
		</Card.Root>
	);
}
