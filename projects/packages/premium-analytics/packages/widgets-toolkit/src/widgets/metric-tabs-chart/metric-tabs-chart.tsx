/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { ComparativeLineChart, MetricWithComparison, WidgetLoadingOverlay } from '../../components';
import styles from './metric-tabs-chart.module.scss';
import type { ComparativeLineChartSeries } from '../../components/chart-comparative-line/types';
import type { DataFormat } from '../../types';
import type { MouseEvent, ReactNode } from 'react';

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
	/** Accessible label for the metric card group. */
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
 * (each a headline value + period-over-period delta), and below them the
 * selected metric's current line with its previous-period overlay. Reused by
 * Stats time-series widgets (subscribers chart, traffic chart) — the consumer
 * supplies the per-metric data and headline values; this owns selection, series
 * building, and layout.
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

	const handleSelect = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			const key = event.currentTarget.dataset.metricKey as string;
			setSelectedKey( key );
			onMetricChange?.( key );
		},
		[ onMetricChange ]
	);

	const series = useMemo(
		() => ( activeMetric ? buildSeries( activeMetric ) : [] ),
		[ activeMetric ]
	);

	return (
		<Stack direction="column" className={ styles.root }>
			<Stack direction="row" justify="space-between" align="flex-start" className={ styles.header }>
				<div className={ styles.tabs } role="group" aria-label={ groupLabel }>
					{ metrics.map( metric => {
						const isSelected = metric.key === activeMetric?.key;

						return (
							<button
								type="button"
								key={ metric.key }
								data-metric-key={ metric.key }
								aria-pressed={ isSelected }
								onClick={ handleSelect }
								className={ clsx( styles.tab, isSelected && styles.tabSelected ) }
							>
								<Text className={ styles.tabLabel }>{ metric.label }</Text>
								<MetricWithComparison
									value={ metric.value }
									previousValue={ metric.previousValue }
									dataFormat={ metric.dataFormat ?? dataFormat }
									direction="row"
									align="flex-end"
								/>
							</button>
						);
					} ) }
				</div>
				{ controls }
			</Stack>
			<div className={ styles.chart }>
				{ activeMetric && (
					<ComparativeLineChart
						series={ series }
						dataFormat={ activeMetric.dataFormat ?? dataFormat }
					/>
				) }
				{ loading && <WidgetLoadingOverlay /> }
			</div>
		</Stack>
	);
}
