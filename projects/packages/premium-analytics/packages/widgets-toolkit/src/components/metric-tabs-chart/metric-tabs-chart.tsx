/**
 * External dependencies
 */
import {
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
import { formatComparisonSeriesLabel, fromChartDate } from '../../helpers';
import { useSeriesStyles } from '../../hooks';
import { ComparativeBarChart } from '../chart-comparative-bar';
import { ComparativeLineChart } from '../chart-comparative-line';
import { MetricWithComparison } from '../metric-with-comparison';
import { WidgetMetricSelect } from '../widget-metric-select';
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
 * click. Above it the gesture is a drag — a zoom selection, or a slip on the
 * way up — and must not drill the dashboard to a date the reader was only
 * passing over.
 */
const CLICK_DRAG_TOLERANCE_PX = 6;

/**
 * The pointer-event payload both comparative charts report, carrying the datum
 * nearest the pointer.
 */
type ChartPointerParams = Parameters<
	NonNullable< ComponentProps< typeof ComparativeLineChart >[ 'onPointerUp' ] >
>[ 0 ];

/**
 * The keyboard activation payload both comparative charts report, carrying the
 * datum keyboard navigation had selected.
 */
type ChartActivateParams = Parameters<
	NonNullable< ComponentProps< typeof ComparativeLineChart >[ 'onDatumActivate' ] >
>[ 0 ];

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
	 * metric in the list, the metric itself, or a metric that is `unavailable` at
	 * the current bucket size, is ignored.
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
	 * Whether each point's date is a Stats bucket's wall clock (as `toChartDate`
	 * builds them) rather than a real instant. Wall clocks are re-anchored via
	 * `fromChartDate` before a label reads them; instants must be read as they
	 * are, hence the opt-in. Full rationale in `chart-date.ts`.
	 */
	pointsAreWallClocks?: boolean;
	/**
	 * A click on the plot, or Enter on the keyboard-selected point, carrying the
	 * date of that bucket. Omit to leave the chart non-interactive.
	 */
	onDatumClick?: ( date: Date ) => void;
}

/**
 * Resolves a chart point's date to the instant its label should name. Which one
 * applies is the producer's to declare, through `pointsAreWallClocks`.
 */
type ReadPointDate = ( date: Date ) => Date;

const asInstant: ReadPointDate = date => date;

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
	tickResolution,
	readPointDate,
	onDatumClick,
}: {
	metric: MetricTab;
	counterpart?: MetricTab;
	dataFormat: DataFormat;
	chartType: MetricTabsChartType;
	chartId: string;
	tickResolution?: TickResolution;
	readPointDate: ReadPointDate;
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
		( date: Date, format: DateFormatName ) => formatDate( readPointDate( date ), format ),
		[ readPointDate ]
	);

	const pointerDownRef = useRef< { x: number; y: number } | null >( null );

	const reportDatum = useCallback(
		( datum: unknown ) => {
			/*
			 * `alignSeriesDates` rewrites a comparison point's date to the primary
			 * point it is drawn under, so whichever series the gesture resolves to,
			 * its datum carries the current-period date.
			 */
			const date = ( datum as { date?: unknown } | undefined )?.date;

			if ( date instanceof Date ) {
				onDatumClick?.( readPointDate( date ) );
			}
		},
		[ onDatumClick, readPointDate ]
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

	// Resolve each series' colour + line style from the chart theme so the chart
	// lines and the tooltip glyphs share the same styling — including the dashed
	// pattern on the previous-period series. Bars resolve their own styles inside
	// `ComparativeBarChart`, since the shadow's geometry comes from the theme's
	// bar styles rather than these line styles.
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
 * A metric's card face: its label over the headline value and delta, or over a
 * placeholder when the metric has nothing to report at this bucket size. Shared
 * by the tab, single-metric, and dropdown-trigger layouts so the three cannot
 * drift apart.
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
	// The unavailable reason has no other channel here, so it is always exposed.
	// The description is not: as a tab it already rides on `title`, and inside the
	// dropdown trigger a hidden node would join the button's accessible name and
	// be announced on every focus.
	const note = metric.unavailable ?? ( withDescription ? metric.description : undefined );

	return (
		<span className={ styles.tabContent }>
			<Text className={ styles.tabLabel }>{ metric.label }</Text>
			{ metric.unavailable ? (
				// Sized off the same token as the value it stands in for — the tab and
				// trigger layouts ask for different ones, so a fixed size reads a step
				// too large in one of them. `MetricWithComparison`'s own default.
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
	tickResolution,
	pointsAreWallClocks = false,
	onDatumClick,
}: MetricTabsChartProps ) {
	const readPointDate = pointsAreWallClocks ? fromChartDate : asInstant;
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
		( metric: MetricTab ) => {
			if ( ! metric.counterpartKey || metric.counterpartKey === metric.key ) {
				return undefined;
			}

			const counterpart = metrics.find( candidate => candidate.key === metric.counterpartKey );

			// A counterpart with nothing to report at this bucket size would reach
			// the legend as a series the request never asked for, and reveal as a
			// flat zero line.
			return counterpart?.unavailable ? undefined : counterpart;
		},
		[ metrics ]
	);

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
						readPointDate={ readPointDate }
						onDatumClick={ onDatumClick }
					/>
				</div>
			</div>
		);
	}

	if ( useDropdown ) {
		return (
			<div ref={ measureRef } className={ styles.root }>
				<div className={ styles.header }>
					<WidgetMetricSelect
						className={ styles.picker }
						selectClassName={ styles.metricSelect }
						label={ groupLabel }
						items={ metricItems }
						value={ activeMetric?.key ?? '' }
						onChange={ handleValueChange }
						triggerContent={
							activeMetric && <MetricTabContent metric={ activeMetric } dataFormat={ dataFormat } />
						}
					/>
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
							readPointDate={ readPointDate }
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
						readPointDate={ readPointDate }
						onDatumClick={ onDatumClick }
					/>
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}
