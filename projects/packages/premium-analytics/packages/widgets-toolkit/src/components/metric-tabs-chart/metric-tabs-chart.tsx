/**
 * External dependencies
 */
import {
	SelectControl,
	Tabs,
	Text,
	VisuallyHidden,
	type TickResolution,
} from '@jetpack-premium-analytics/externals';
import { formatDate, type DateFormatName } from '@jetpack-premium-analytics/formatters';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { formatComparisonSeriesLabel } from '../../helpers';
import { useSeriesStyles } from '../../hooks';
import { ComparativeBarChart } from '../chart-comparative-bar';
import { ComparativeLineChart } from '../chart-comparative-line';
import { MetricWithComparison } from '../metric-with-comparison';
import styles from './metric-tabs-chart.module.scss';
import type { DataFormat } from '../../types';
import type { ComparativeLineChartSeries } from '../chart-comparative-line/types';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

/**
 * Width (px) budgeted per metric tab; below `metrics.length` times this the
 * tabs collapse into a dropdown instead of overflowing into a scrollbar.
 */
const MIN_TAB_WIDTH = 120;

/**
 * How far (px) the pointer may travel between down and up and still count as a
 * click. Above it the gesture is a drag and must not drill the dashboard.
 */
const CLICK_DRAG_TOLERANCE_PX = 6;

/** The pointer-event payload both comparative charts report. */
type ChartPointerParams = Parameters<
	NonNullable< ComponentProps< typeof ComparativeLineChart >[ 'onPointerUp' ] >
>[ 0 ];

/** The keyboard activation payload both comparative charts report. */
type ChartActivateParams = Parameters<
	NonNullable< ComponentProps< typeof ComparativeLineChart >[ 'onDatumActivate' ] >
>[ 0 ];

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
	 * Key of the metric to draw beside this one, hidden until the reader reveals it
	 * from the legend. A key naming no metric in the list, the metric itself, or an
	 * `unavailable` metric, is ignored.
	 */
	counterpartKey?: string;
	/**
	 * Why this metric has no data at the current bucket size. Set it and the card
	 * shows a placeholder instead of a value, and the chart the reason instead of
	 * a flat zero line. The tab stays selectable, so the reason is reachable.
	 */
	unavailable?: string;
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
	/**
	 * The series' bucket size, declared to the x-axis so tick formats follow the
	 * known granularity rather than being inferred from point spacing.
	 */
	tickResolution?: TickResolution;
	/**
	 * A click on the plot, or Enter on the keyboard-selected point, carrying the
	 * date of that bucket. Omit to leave the chart non-interactive.
	 */
	onDatumClick?: ( date: Date ) => void;
}

/**
 * Build the chart series for a metric: current period plus, when present, the
 * previous period as a same-`group` comparison series. A line needs its area
 * fill suppressed — that gradient would erase the bar chart's shadow fill.
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
			label: formatComparisonSeriesLabel( metric.label ),
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
 * overlay, drawn as lines or bars. A `counterpart` is drawn alongside it but
 * seeded hidden, so the legend offers it as a one-click comparison.
 *
 * @return The chart for the metric.
 */
function MetricChart( {
	metric,
	counterpart,
	dataFormat,
	chartType,
	chartId,
	tickResolution,
	onDatumClick,
}: {
	metric: MetricTab;
	counterpart?: MetricTab;
	dataFormat: DataFormat;
	chartType: MetricTabsChartType;
	chartId: string;
	tickResolution?: TickResolution;
	onDatumClick?: ( date: Date ) => void;
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
	const formatTooltipDate = useCallback(
		( date: Date, format: DateFormatName ) => formatDate( date, format ),
		[]
	);

	const pointerDownRef = useRef< { x: number; y: number } | null >( null );

	const reportDatum = useCallback(
		( datum: unknown ) => {
			// `alignSeriesDates` rewrites a comparison point's date to the primary point
			// it is drawn under, so either series' datum carries the current-period date.
			const date = ( datum as { date?: unknown } | undefined )?.date;

			if ( date instanceof Date ) {
				onDatumClick?.( date );
			}
		},
		[ onDatumClick ]
	);

	const handlePointerDown = useCallback( ( { svgPoint }: ChartPointerParams ) => {
		pointerDownRef.current = svgPoint ? { x: svgPoint.x, y: svgPoint.y } : null;
	}, [] );

	const handlePointerUp = useCallback(
		( { datum, svgPoint }: ChartPointerParams ) => {
			const start = pointerDownRef.current;
			pointerDownRef.current = null;

			// A release with no press behind it is the tail of a gesture that began
			// off the plot, so there is no click here to report.
			if ( ! start ) {
				return;
			}

			if (
				svgPoint &&
				Math.hypot( svgPoint.x - start.x, svgPoint.y - start.y ) > CLICK_DRAG_TOLERANCE_PX
			) {
				return;
			}

			reportDatum( datum );
		},
		[ reportDatum ]
	);

	const handleActivate = useCallback(
		( { datum }: ChartActivateParams ) => reportDatum( datum ),
		[ reportDatum ]
	);

	// Left off entirely without a handler, so a chart that does not drill keeps
	// no pointer or keyboard listeners at all.
	const drillHandlers = onDatumClick
		? {
				onPointerDown: handlePointerDown,
				onPointerUp: handlePointerUp,
				onDatumActivate: handleActivate,
		  }
		: {};

	// Resolved from the chart theme so the lines and the tooltip glyphs match. Bars
	// resolve their own inside `ComparativeBarChart`, off the theme's bar styles.
	const seriesStyles = useSeriesStyles( series );
	const resolvedDataFormat = metric.dataFormat ?? dataFormat;

	// Without a counterpart the legend holds a single item — the metric's two
	// periods collapsed — and clicking it would only empty the chart.
	const legendInteractive = !! counterpart;

	if ( metric.unavailable ) {
		return <div className={ styles.unavailableChart }>{ metric.unavailable }</div>;
	}

	return chartType === 'bar' ? (
		<ComparativeBarChart
			chartId={ chartId }
			series={ series }
			dataFormat={ resolvedDataFormat }
			defaultHiddenSeries={ defaultHiddenSeries }
			legendInteractive={ legendInteractive }
			tickResolution={ tickResolution }
			formatTooltipDate={ formatTooltipDate }
			compactWhenShort
			{ ...drillHandlers }
		/>
	) : (
		<ComparativeLineChart
			chartId={ chartId }
			series={ series }
			styles={ seriesStyles }
			dataFormat={ resolvedDataFormat }
			defaultHiddenSeries={ defaultHiddenSeries }
			legendInteractive={ legendInteractive }
			tickResolution={ tickResolution }
			formatTooltipDate={ formatTooltipDate }
			compactWhenShort
			{ ...drillHandlers }
		/>
	);
}

/**
 * A metric's card face, shared by the tab, single-metric, and dropdown-trigger
 * layouts so the three cannot drift apart.
 *
 * @return The card's content.
 */
function MetricTabContent( {
	metric,
	dataFormat,
	fontSize,
	withDescription = false,
}: {
	metric: MetricTab;
	dataFormat: DataFormat;
	fontSize?: ComponentProps< typeof MetricWithComparison >[ 'fontSize' ];
	withDescription?: boolean;
} ) {
	// The description is opt-in: a tab already carries it on `title`, and in the
	// dropdown trigger a hidden node would join the button's accessible name.
	const note = metric.unavailable ?? ( withDescription ? metric.description : undefined );

	return (
		<span className={ styles.tabContent }>
			<Text className={ styles.tabLabel }>{ metric.label }</Text>
			{ metric.unavailable ? (
				// Sized off the same token as the value it stands in for: the tab and
				// trigger layouts ask for different ones, so a fixed size misreads in one.
				<span
					className={ styles.unavailableValue }
					style={
						{
							'--jpa-unavailable-value-font-size': `var( --wpds-typography-font-size-${
								fontSize ?? 'xl'
							} )`,
						} as CSSProperties
					}
					aria-hidden="true"
				>
					&mdash;
				</span>
			) : (
				<MetricWithComparison
					className={ styles.metricComparison }
					value={ metric.value }
					previousValue={ metric.previousValue }
					dataFormat={ metric.dataFormat ?? dataFormat }
					fontSize={ fontSize }
					direction="row"
					align="flex-end"
				/>
			) }
			{ note && <VisuallyHidden>{ note }</VisuallyHidden> }
		</span>
	);
}

/**
 * A metric switcher over a comparative chart: a row of selectable cards and, below
 * them, the selected metric's chart. The consumer supplies the per-metric data;
 * this owns selection, series building, and layout.
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
	tickResolution,
	onDatumClick,
}: MetricTabsChartProps ) {
	const [ selectedKey, setSelectedKey ] = useState( defaultMetricKey ?? metrics[ 0 ]?.key );

	// The chart seeds its hidden series once per chart ID, so a stable ID would leave
	// the chart showing the previous selection's hidden set.
	const chartIdBase = useId();
	const chartIdFor = useCallback(
		( metric: MetricTab ) => `${ chartIdBase }-${ metric.key }`,
		[ chartIdBase ]
	);
	const counterpartFor = useCallback(
		( metric: MetricTab ) => {
			if ( ! metric.counterpartKey || metric.counterpartKey === metric.key ) {
				return undefined;
			}

			const counterpart = metrics.find( candidate => candidate.key === metric.counterpartKey );

			// A counterpart with nothing to report at this bucket size would reveal as
			// a flat zero line for a series the request never asked for.
			return counterpart?.unavailable ? undefined : counterpart;
		},
		[ metrics ]
	);

	// Controlled open state: the drag-sortable wrapper closes the popup (reason
	// 'none') right after it opens, so those closes are dropped; selection closes it explicitly.
	const [ isDropdownOpen, setIsDropdownOpen ] = useState( false );

	// Flips are debounced: each remounts the header + chart subtree, and a drag-resize
	// oscillates the width around grid snap boundaries fast enough to freeze the page.
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
							<MetricTabContent
								metric={ activeMetric }
								dataFormat={ dataFormat }
								fontSize="2xl"
								withDescription
							/>
						</div>
					</div>
					{ controls }
				</div>
				<div className={ clsx( styles.chart, onDatumClick && styles.drillable ) }>
					<MetricChart
						metric={ activeMetric }
						counterpart={ counterpartFor( activeMetric ) }
						dataFormat={ dataFormat }
						chartType={ chartType }
						chartId={ chartIdFor( activeMetric ) }
						tickResolution={ tickResolution }
						onDatumClick={ onDatumClick }
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
					{ /* Stops pointer-down from starting a widget drag. Mouse-only supplement —
					     keyboard users open the select through the trigger button itself. */ }
					{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */ }
					<div
						className={ styles.picker }
						onPointerDown={ event => event.stopPropagation() }
						onMouseDown={ event => event.stopPropagation() }
						onClick={ event => {
							// React bubbles portaled popup events through the component tree, so
							// option clicks land here too and would undo the close-on-select.
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
									<MetricTabContent metric={ activeMetric } dataFormat={ dataFormat } />
								)
							}
						/>
					</div>
					{ controls }
				</div>
				<div className={ clsx( styles.chart, onDatumClick && styles.drillable ) }>
					{ activeMetric && (
						<MetricChart
							metric={ activeMetric }
							counterpart={ counterpartFor( activeMetric ) }
							dataFormat={ dataFormat }
							chartType={ chartType }
							chartId={ chartIdFor( activeMetric ) }
							tickResolution={ tickResolution }
							onDatumClick={ onDatumClick }
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
							title={ metric.unavailable ?? metric.description }
						>
							<MetricTabContent metric={ metric } dataFormat={ dataFormat } fontSize="2xl" />
						</Tabs.Tab>
					) ) }
				</Tabs.List>
				{ controls }
			</div>
			{ /* One panel per tab (WAI-ARIA + @wordpress/ui parity). Only the active
			     metric's panel renders its chart; the rest stay empty. */ }
			{ metrics.map( metric => (
				<Tabs.Panel
					key={ metric.key }
					value={ metric.key }
					className={ clsx( styles.chart, onDatumClick && styles.drillable ) }
				>
					<MetricChart
						metric={ metric }
						counterpart={ counterpartFor( metric ) }
						dataFormat={ dataFormat }
						chartType={ chartType }
						chartId={ chartIdFor( metric ) }
						tickResolution={ tickResolution }
						onDatumClick={ onDatumClick }
					/>
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
