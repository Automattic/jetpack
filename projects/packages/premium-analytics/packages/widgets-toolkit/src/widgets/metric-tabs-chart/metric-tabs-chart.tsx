/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Tabs, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { ComparativeLineChart, MetricWithComparison, WidgetLoadingOverlay } from '../../components';
import { useSeriesStyles } from '../../hooks';
import styles from './metric-tabs-chart.module.scss';
import type { ComparativeLineChartSeries } from '../../components/chart-comparative-line/types';
import type { DataFormat } from '../../types';
import type { ReactNode } from 'react';

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
 * Label a previous-period series, e.g. "Subscribers (previous period)".
 *
 * @param metricLabel - The current-period metric label.
 * @return The previous-period label.
 */
function previousPeriodLabel( metricLabel: string ): string {
	return sprintf(
		/* translators: %s is a metric name, e.g. "Subscribers". */
		__( '%s (previous period)', 'jetpack-premium-analytics' ),
		metricLabel
	);
}

/**
 * Build the chart series for a metric: the current period as a solid line plus,
 * when present, the previous period as a same-`group` (same colour) `comparison`
 * (dashed) line with a transparent fill, so only the current line is filled.
 *
 * @param metric - The metric to draw.
 * @return The chart series.
 */
function buildSeries( metric: MetricTab ): ComparativeLineChartSeries[] {
	const series: ComparativeLineChartSeries[] = [
		{ label: metric.label, group: metric.key, data: metric.current },
	];

	if ( metric.previous?.length ) {
		series.push( {
			label: previousPeriodLabel( metric.label ),
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

	// Fall back to the first metric if the selected one is no longer present.
	const activeMetric = metrics.find( metric => metric.key === selectedKey ) ?? metrics[ 0 ];

	const handleValueChange = useCallback(
		( key: string ) => {
			setSelectedKey( key );
			onMetricChange?.( key );
		},
		[ onMetricChange ]
	);

	const series = useMemo(
		() => ( activeMetric ? buildSeries( activeMetric ) : [] ),
		[ activeMetric ]
	);

	// Resolve each series' colour + line style from the chart theme so the chart
	// lines and the tooltip glyphs share the same styling — including the dashed
	// pattern on the previous-period series.
	const seriesStyles = useSeriesStyles( series );

	return (
		<Tabs.Root
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
			<div className={ styles.chart }>
				{ activeMetric && (
					<ComparativeLineChart
						series={ series }
						styles={ seriesStyles }
						dataFormat={ activeMetric.dataFormat ?? dataFormat }
					/>
				) }
				{ loading && <WidgetLoadingOverlay /> }
			</div>
		</Tabs.Root>
	);
}
