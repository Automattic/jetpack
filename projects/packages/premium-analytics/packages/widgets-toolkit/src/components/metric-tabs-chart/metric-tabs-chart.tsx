/**
 * External dependencies
 */
import { SelectControl, Tabs, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { useResizeObserver } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { useSeriesStyles } from '../../hooks';
import { ComparativeBarChart } from '../chart-comparative-bar';
import { ComparativeLineChart } from '../chart-comparative-line';
import { MetricWithComparison } from '../metric-with-comparison';
import styles from './metric-tabs-chart.module.scss';
import type { DataFormat } from '../../types';
import type { ComparativeLineChartSeries } from '../chart-comparative-line/types';
import type { ReactNode } from 'react';

/**
 * Width (px) budgeted per metric tab; below `metrics.length` times this the
 * tabs collapse into a dropdown instead of overflowing into a scrollbar.
 */
const MIN_TAB_WIDTH = 120;

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
	/**
	 * Key of the metric to draw beside this one, hidden until the reader reveals
	 * it from the legend. Pairs are declared per metric rather than derived, so
	 * a widget decides which of its metrics are worth comparing. A key naming no
	 * metric in the list, or the metric itself, is ignored.
	 */
	counterpartKey?: string;
}

/**
 * How the selected metric's series are drawn. `line` keeps the previous period
 * as a dashed overlay; `bar` draws it as the translucent shadow behind each bar.
 */
export type MetricTabsChartType = 'line' | 'bar';

export interface MetricTabsChartProps {
	/** Metrics to expose as selectable cards; the first is selected by default. */
	metrics: MetricTab[];
	/** Default value/axis format for the cards and chart. */
	dataFormat: DataFormat;
	/** How to draw the selected metric. Defaults to `line`. */
	chartType?: MetricTabsChartType;
	/** Initially selected metric key (defaults to the first metric). */
	defaultMetricKey?: string;
	/** Called when the selected metric changes. */
	onMetricChange?: ( key: string ) => void;
	/** Header-right slot for widget-specific controls (e.g. a granularity dropdown). */
	controls?: ReactNode;
	/** Accessible label for the metric tab list. */
	groupLabel?: string;
}

/**
 * Label the previous-period series with a stable key. The chart provider stores
 * visibility by label, so including the range would reveal a seeded-hidden
 * comparison whenever the dashboard dates change without remounting the chart.
 *
 * @param metric - The metric the series belongs to.
 * @return The comparison series' label.
 */
function comparisonLabel( metric: MetricTab ): string {
	return sprintf(
		/* translators: %s is a metric name, e.g. "Views". */
		__( '%s · previous period', 'jetpack-premium-analytics-pkg' ),
		metric.label
	);
}

/**
 * Build the chart series for a metric: the current period plus, when present,
 * the previous period as a same-`group` (same colour) `comparison` series. The
 * current period is labelled by metric name, which is what the collapsed legend
 * item reads; the section header names the dates.
 *
 * The comparison series' options differ by chart type. A line needs its area
 * fill suppressed so only the current period is filled — but that same
 * transparent gradient would erase the bar chart's shadow bar, which is a fill
 * rather than a stroke. Bars therefore carry `type` alone and let the charts
 * theme resolve the shadow's colour and width factor.
 *
 * @param metric    - The metric to draw.
 * @param chartType - How the metric is drawn.
 * @return The chart series.
 */
function buildSeries(
	metric: MetricTab,
	chartType: MetricTabsChartType
): ComparativeLineChartSeries[] {
	const series: ComparativeLineChartSeries[] = [
		{ label: metric.label, group: metric.key, data: metric.current },
	];

	if ( metric.previous?.length ) {
		series.push( {
			label: comparisonLabel( metric ),
			group: metric.key,
			data: metric.previous,
			options:
				chartType === 'bar'
					? { type: 'comparison' }
					: {
							type: 'comparison',
							gradient: {
								from: 'transparent',
								to: 'transparent',
								fromOpacity: 0,
								toOpacity: 0,
							},
					  },
		} );
	}

	return series;
}

/**
 * The chart for a single metric — the current period with its previous-period
 * overlay, drawn as lines or bars. `compactWhenShort` lets the chart degrade to
 * a sparkline (dropping its axis, grid, and legend) on short tiles instead of
 * squashing its labels on top of each other.
 *
 * A `counterpart` is drawn alongside the metric but seeded hidden, so the
 * legend offers it as a one-click comparison. Its previous period is seeded
 * with it, which is why revealing the item brings the whole overlay back.
 *
 * @return The chart for the metric.
 */
function MetricChart( {
	metric,
	counterpart,
	dataFormat,
	chartType,
	chartId,
}: {
	metric: MetricTab;
	counterpart?: MetricTab;
	dataFormat: DataFormat;
	chartType: MetricTabsChartType;
	chartId: string;
} ) {
	const { series, defaultHiddenSeries } = useMemo( () => {
		const active = buildSeries( metric, chartType );

		if ( ! counterpart ) {
			return { series: active, defaultHiddenSeries: undefined };
		}

		const paired = buildSeries( counterpart, chartType );
		return {
			series: [ ...active, ...paired ],
			defaultHiddenSeries: paired.map( item => item.label ),
		};
	}, [ metric, counterpart, chartType ] );

	// Resolve each series' colour + line style from the chart theme so the chart
	// lines and the tooltip glyphs share the same styling — including the dashed
	// pattern on the previous-period series. Bars resolve their own styles inside
	// `ComparativeBarChart`, since the shadow's geometry comes from the theme's
	// bar styles rather than these line styles.
	const seriesStyles = useSeriesStyles( series );
	const resolvedDataFormat = metric.dataFormat ?? dataFormat;

	// A lone legend item has nothing to compare against, and clicking it would
	// only empty the chart.
	const legendInteractive = !! counterpart;

	return chartType === 'bar' ? (
		<ComparativeBarChart
			chartId={ chartId }
			series={ series }
			dataFormat={ resolvedDataFormat }
			defaultHiddenSeries={ defaultHiddenSeries }
			legendInteractive={ legendInteractive }
			compactWhenShort
		/>
	) : (
		<ComparativeLineChart
			chartId={ chartId }
			series={ series }
			styles={ seriesStyles }
			dataFormat={ resolvedDataFormat }
			defaultHiddenSeries={ defaultHiddenSeries }
			legendInteractive={ legendInteractive }
			compactWhenShort
		/>
	);
}

/**
 * A metric switcher over a comparative chart: a row of selectable cards
 * (each a headline value + period-over-period delta) built on `@wordpress/ui`
 * `Tabs`, and below them the selected metric's current period with its
 * previous-period overlay, drawn as lines or bars per `chartType`. Reused by
 * Stats time-series widgets (subscribers chart, traffic chart) — the consumer
 * supplies the per-metric data and headline values; this owns selection, series
 * building, and layout.
 *
 * A metric naming another through `counterpartKey` is drawn with that metric
 * beside it, seeded hidden so the legend offers it as a one-click comparison.
 * The legend names the metrics; the dates the chart covers are the section
 * header's job.
 *
 * Responsive: on narrow tiles the tabs collapse into a dropdown whose trigger
 * is the selected metric's card; on short tiles the chart degrades to a sparkline.
 *
 * @param {MetricTabsChartProps} props - The component props.
 * @return The metric tabs + chart.
 */
export function MetricTabsChart( {
	metrics,
	dataFormat,
	chartType = 'line',
	defaultMetricKey,
	onMetricChange,
	controls,
	groupLabel = __( 'Select metric', 'jetpack-premium-analytics-pkg' ),
}: MetricTabsChartProps ) {
	const [ selectedKey, setSelectedKey ] = useState( defaultMetricKey ?? metrics[ 0 ]?.key );

	// The chart seeds its hidden series once per chart ID, so the ID has to name
	// the metric: switching metrics swaps which of a pair is hidden, and a stable
	// ID would leave the chart showing the previous selection's hidden set.
	const chartIdBase = useId();
	const chartIdFor = useCallback(
		( metric: MetricTab ) => `${ chartIdBase }-${ metric.key }`,
		[ chartIdBase ]
	);
	const counterpartFor = useCallback(
		( metric: MetricTab ) =>
			metric.counterpartKey && metric.counterpartKey !== metric.key
				? metrics.find( candidate => candidate.key === metric.counterpartKey )
				: undefined,
		[ metrics ]
	);

	// Controlled open state: the dashboard's focusable drag-sortable wrapper
	// closes the popup (reason 'none') right after it opens, so we open on
	// click, drop 'none' closes, and close explicitly on selection. Real closes
	// (outside press, Escape) carry a specific reason and pass through.
	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );

	// Tabs↔dropdown flips are debounced: each flip remounts the header + chart
	// subtree, and during a drag-resize the width oscillates around grid snap
	// boundaries fast enough to freeze the page and abort the gesture.
	const [ width, setWidth ] = useState< number >();
	const hasMeasuredRef = useRef( false );
	const flipTimerRef = useRef< ReturnType< typeof setTimeout > >();
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( ! rect ) {
			return;
		}
		// Apply the mount measure immediately so a narrow tile doesn't flash tabs.
		if ( ! hasMeasuredRef.current ) {
			hasMeasuredRef.current = true;
			setWidth( rect.width );
			return;
		}
		clearTimeout( flipTimerRef.current );
		flipTimerRef.current = setTimeout( () => setWidth( rect.width ), 150 );
	} );
	useEffect( () => () => clearTimeout( flipTimerRef.current ), [] );
	const useDropdown = width !== undefined && width < metrics.length * MIN_TAB_WIDTH;

	// Fall back to the first metric if the selected one is no longer present.
	const activeMetric = metrics.find( metric => metric.key === selectedKey ) ?? metrics[ 0 ];

	const handleValueChange = useCallback(
		( key: string ) => {
			setSelectedKey( key );
			onMetricChange?.( key );
		},
		[ onMetricChange ]
	);

	// Memoised: an unstable `items` identity makes the select re-initialise and
	// close its popup as it opens.
	const metricItems = useMemo(
		() => metrics.map( metric => ( { label: metric.label, value: metric.key } ) ),
		[ metrics ]
	);

	if ( metrics.length === 1 && activeMetric ) {
		return (
			<div className={ styles.root }>
				<div className={ styles.header }>
					<div className={ clsx( styles.tabs, styles.singleMetric ) }>
						<div className={ styles.tab }>
							<span className={ styles.tabContent }>
								<Text className={ styles.tabLabel }>{ activeMetric.label }</Text>
								<MetricWithComparison
									className={ styles.metricComparison }
									value={ activeMetric.value }
									previousValue={ activeMetric.previousValue }
									dataFormat={ activeMetric.dataFormat ?? dataFormat }
									fontSize="2xl"
									direction="row"
									align="flex-end"
								/>
								{ activeMetric.description && (
									<VisuallyHidden>{ activeMetric.description }</VisuallyHidden>
								) }
							</span>
						</div>
					</div>
					{ controls }
				</div>
				<div className={ styles.chart }>
					<MetricChart
						metric={ activeMetric }
						counterpart={ counterpartFor( activeMetric ) }
						dataFormat={ dataFormat }
						chartType={ chartType }
						chartId={ chartIdFor( activeMetric ) }
					/>
				</div>
			</div>
		);
	}

	if ( useDropdown ) {
		// `value` must be a reference into `metricItems` for the select to match it.
		const activeItem =
			metricItems.find( item => item.value === activeMetric?.key ) ?? metricItems[ 0 ];

		return (
			<div ref={ measureRef } className={ styles.root }>
				<div className={ styles.header }>
					{ /* Stops pointer-down from starting a widget drag and opens the select
					     on click (see `isDropdownOpen`). Mouse-only supplement — keyboard
					     users open the select through the trigger button itself. */ }
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */ }
					<div
						className={ styles.picker }
						onPointerDown={ event => event.stopPropagation() }
						onMouseDown={ event => event.stopPropagation() }
						onClick={ event => {
							// React bubbles portaled popup events through the component tree,
							// so option clicks land here too; reopening on them would undo the
							// close-on-select. Only treat clicks inside the wrapper as opens.
							if ( event.currentTarget.contains( event.target as Node ) ) {
								setIsDropdownOpen( true );
							}
						} }
					>
						<SelectControl
							className={ styles.metricSelect }
							label={ groupLabel }
							hideLabelFromVision
							open={ isDropdownOpen }
							onOpenChange={ ( nextOpen, details ) => {
								// Drop the wrapper focus churn's 'none' closes; selection closes
								// are handled in `onValueChange`.
								if ( ! nextOpen && details?.reason === 'none' ) {
									return;
								}
								setIsDropdownOpen( nextOpen );
							} }
							items={ metricItems }
							value={ activeItem }
							onValueChange={ item => {
								if ( item?.value ) {
									handleValueChange( item.value );
								}
								setIsDropdownOpen( false );
							} }
							triggerContent={
								activeMetric && (
									<span className={ styles.tabContent }>
										<Text className={ styles.tabLabel }>{ activeMetric.label }</Text>
										<MetricWithComparison
											className={ styles.metricComparison }
											value={ activeMetric.value }
											previousValue={ activeMetric.previousValue }
											dataFormat={ activeMetric.dataFormat ?? dataFormat }
											direction="row"
											align="flex-end"
										/>
									</span>
								)
							}
						/>
					</div>
					{ controls }
				</div>
				<div className={ styles.chart }>
					{ activeMetric && (
						<MetricChart
							metric={ activeMetric }
							counterpart={ counterpartFor( activeMetric ) }
							dataFormat={ dataFormat }
							chartType={ chartType }
							chartId={ chartIdFor( activeMetric ) }
						/>
					) }
				</div>
			</div>
		);
	}

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
									className={ styles.metricComparison }
									value={ metric.value }
									previousValue={ metric.previousValue }
									dataFormat={ metric.dataFormat ?? dataFormat }
									fontSize="2xl"
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
					<MetricChart
						metric={ metric }
						counterpart={ counterpartFor( metric ) }
						dataFormat={ dataFormat }
						chartType={ chartType }
						chartId={ chartIdFor( metric ) }
					/>
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
