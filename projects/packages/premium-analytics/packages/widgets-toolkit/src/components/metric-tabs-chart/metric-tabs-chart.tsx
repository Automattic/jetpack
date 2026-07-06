/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Tabs, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { useSeriesStyles } from '../../hooks';
import { ComparativeLineChart } from '../chart-comparative-line';
import { MetricWithComparison } from '../metric-with-comparison';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import styles from './metric-tabs-chart.module.scss';
import type { DataFormat } from '../../types';
import type { ComparativeLineChartSeries } from '../chart-comparative-line/types';
import type { ReactNode } from 'react';

/**
 * Minimum widget height (px) before the chart is worth showing; below this only
 * the metric cards render, so the chart never collapses into a sliver.
 */
const MIN_HEIGHT_FOR_CHART = 260;

/**
 * A single time-series point for a metric.
 */
export interface MetricTabDatum {
	date: Date;
	value: number;
}

/**
 * One selectable metric: a headline value + delta for its card, and the current
 * (and optional previous) period series for the chart.
 */
export interface MetricTab {
	/** Stable key; also the chart `group`, so a metric's current and previous lines share a colour. */
	key: string;
	label: string;
	/** Headline value for the card (the consumer decides whether that's a sum, a latest total, …). */
	value: number;
	/** Previous-period headline for the delta; omit/null to hide the delta. */
	previousValue?: number | null;
	/** Current-period chart points, oldest first. */
	current: MetricTabDatum[];
	/** Previous-period chart points; rendered as a same-colour dashed overlay when present. */
	previous?: MetricTabDatum[];
	/** Per-metric format override (e.g. percentage); falls back to the chart-level `dataFormat`. */
	dataFormat?: DataFormat;
	/** Optional explanatory text, surfaced as the card's tooltip. */
	description?: string;
}

export interface MetricTabsChartProps {
	/** Metrics to expose as selectable cards; the first is selected by default. */
	metrics: MetricTab[];
	/** Default value/axis format for the cards and chart. */
	dataFormat: DataFormat;
	/** Initially selected metric key (defaults to the first metric). */
	defaultMetricKey?: string;
	/** Called when the selected metric changes. */
	onMetricChange?: ( key: string ) => void;
	/** Header-right slot for widget-specific controls (e.g. a granularity dropdown). */
	controls?: ReactNode;
	/** Show the loading overlay over the chart. */
	loading?: boolean;
	/** Accessible label for the metric tab list. */
	groupLabel?: string;
}

/**
 * Format a series' legend label as its date range (first to last point), so the
 * legend reads as date ranges — consistent with the other comparative charts
 * (see `buildTimeSeriesChartData`). The selected card names the metric.
 *
 * @param points - The series points, oldest first.
 * @return The formatted date range, or '' when empty.
 */
function rangeLabel( points: MetricTabDatum[] ): string {
	const first = points[ 0 ];
	const last = points[ points.length - 1 ];
	return first && last ? formatDateRange( { from: first.date, to: last.date } ) : '';
}

/**
 * Build the chart series for a metric: the current period as a solid line plus,
 * when present, the previous period as a same-`group` (same colour) `comparison`
 * (dashed) line with a transparent fill, so only the current line is filled.
 * Series are labelled by date range for the legend.
 *
 * @param metric - The metric to draw.
 * @return The chart series.
 */
function buildSeries( metric: MetricTab ): ComparativeLineChartSeries[] {
	const series: ComparativeLineChartSeries[] = [
		{ label: rangeLabel( metric.current ), group: metric.key, data: metric.current },
	];

	if ( metric.previous?.length ) {
		series.push( {
			label: rangeLabel( metric.previous ),
			group: metric.key,
			data: metric.previous,
			options: {
				type: 'comparison',
				gradient: { from: 'transparent', to: 'transparent', fromOpacity: 0, toOpacity: 0 },
			},
		} );
	}

	return series;
}

/**
 * The chart for a single metric — the current line with its dashed
 * previous-period overlay. Rendered inside the metric's tab panel, so the chart
 * (and its `useSeriesStyles` work) only mounts for the selected metric.
 *
 * @param {object}     props            - The component props.
 * @param {MetricTab}  props.metric     - The metric to chart.
 * @param {DataFormat} props.dataFormat - Fallback value/axis format.
 * @param {boolean}    props.loading    - Whether to overlay the loading state.
 * @return The chart for the metric.
 */
function MetricChart( {
	metric,
	dataFormat,
	loading,
}: {
	metric: MetricTab;
	dataFormat: DataFormat;
	loading: boolean;
} ) {
	const series = useMemo( () => buildSeries( metric ), [ metric ] );

	// Resolve each series' colour + line style from the chart theme so the chart
	// lines and the tooltip glyphs share the same styling — including the dashed
	// pattern on the previous-period series.
	const seriesStyles = useSeriesStyles( series );

	return (
		<>
			<ComparativeLineChart
				series={ series }
				styles={ seriesStyles }
				dataFormat={ metric.dataFormat ?? dataFormat }
			/>
			{ loading && <WidgetLoadingOverlay /> }
		</>
	);
}

/**
 * A metric switcher over a comparative line chart: a row of selectable cards
 * (each a headline value + period-over-period delta) built on `@wordpress/ui`
 * `Tabs`, and below them the selected metric's current line with its
 * previous-period overlay. Reused by Stats time-series widgets (subscribers
 * chart, traffic chart) — the consumer supplies the per-metric data and headline
 * values; this owns selection, series building, and layout.
 *
 * @param {MetricTabsChartProps} props - The component props.
 * @return The metric tabs + chart.
 */
export function MetricTabsChart( {
	metrics,
	dataFormat,
	defaultMetricKey,
	onMetricChange,
	controls,
	loading = false,
	groupLabel = __( 'Select metric', 'jetpack-premium-analytics' ),
}: MetricTabsChartProps ) {
	const [ selectedKey, setSelectedKey ] = useState( defaultMetricKey ?? metrics[ 0 ]?.key );

	// Hide the chart on short tiles and show only the metric cards, rather than
	// squashing the chart into an unreadable sliver. Mirrors analytics-at-a-glance.
	const [ hasRoomForChart, setHasRoomForChart ] = useState( true );
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			setHasRoomForChart( rect.height >= MIN_HEIGHT_FOR_CHART );
		}
	} );

	// Fall back to the first metric if the selected one is no longer present.
	const activeMetric = metrics.find( metric => metric.key === selectedKey ) ?? metrics[ 0 ];

	const handleValueChange = useCallback(
		( key: string ) => {
			setSelectedKey( key );
			onMetricChange?.( key );
		},
		[ onMetricChange ]
	);

	return (
		<Tabs.Root
			ref={ measureRef }
			value={ activeMetric?.key }
			onValueChange={ handleValueChange }
			className={ styles.root }
		>
			<div className={ styles.header }>
				<Tabs.List variant="minimal" className={ styles.tabs } aria-label={ groupLabel }>
					{ metrics.map( metric => (
						<Tabs.Tab
							key={ metric.key }
							value={ metric.key }
							className={ styles.tab }
							title={ metric.description }
						>
							<span className={ styles.tabContent }>
								<Text className={ styles.tabLabel }>{ metric.label }</Text>
								<MetricWithComparison
									value={ metric.value }
									previousValue={ metric.previousValue }
									dataFormat={ metric.dataFormat ?? dataFormat }
									direction="row"
									align="flex-end"
								/>
							</span>
						</Tabs.Tab>
					) ) }
				</Tabs.List>
				{ controls }
			</div>
			{ /* One panel per tab (WAI-ARIA + @wordpress/ui parity). Only the active
			     metric's panel renders its chart; the rest stay empty. */ }
			{ metrics.map( metric => (
				<Tabs.Panel key={ metric.key } value={ metric.key } className={ styles.chart }>
					{ hasRoomForChart && (
						<MetricChart metric={ metric } dataFormat={ dataFormat } loading={ loading } />
					) }
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
