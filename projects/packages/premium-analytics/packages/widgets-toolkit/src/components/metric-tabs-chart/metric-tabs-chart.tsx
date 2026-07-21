/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { SelectControl, Tabs, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
 * previous-period overlay. `compactWhenShort` lets the chart degrade to a
 * sparkline (dropping its axis, grid, and legend) on short tiles instead of
 * squashing its labels on top of each other.
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
				compactWhenShort
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
 * Responsive: on narrow tiles the tabs collapse into a dropdown whose trigger
 * is the selected metric's card; on short tiles the chart degrades to a sparkline.
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
						<MetricChart metric={ activeMetric } dataFormat={ dataFormat } loading={ loading } />
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
					<MetricChart metric={ metric } dataFormat={ dataFormat } loading={ loading } />
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
