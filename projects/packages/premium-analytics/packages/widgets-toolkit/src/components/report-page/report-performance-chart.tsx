/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@automattic/charts';
import { Button, DropdownMenu, MenuGroup, MenuItem, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, moreVertical } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { useChartTheme, useSeriesStyles } from '../../hooks';
import { ComparativeLineChart } from '../chart-comparative-line';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import { ReportPageSection } from './report-page-layout';
import styles from './report-performance-chart.module.scss';
import { buildReportMetricSeries } from './utils/build-report-metric-series';
import type { ReportChartMetric } from './types';
import type { DataFormat } from '../../types';
import type { ComparativeLineChartSeries } from '../chart-comparative-line/types';
import type { IntervalType, StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

// Charts base styles. Widgets get these through WidgetRoot; report pages
// render charts without a WidgetRoot, so load them here. Without them the
// chart's layout constraints are missing and the svg grows without bound.
import '@automattic/charts/style.css';

const DEFAULT_DATA_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const INTERVAL_LABELS: Partial< Record< IntervalType, string > > = {
	day: __( 'By days', 'jetpack-premium-analytics' ),
	week: __( 'By weeks', 'jetpack-premium-analytics' ),
	month: __( 'By months', 'jetpack-premium-analytics' ),
};

const DEFAULT_INTERVAL_OPTIONS: IntervalType[] = [ 'day', 'week', 'month' ];

/**
 * The default performance metrics — the four site-traffic series returned by
 * the Stats visits endpoint via `stat_fields`.
 *
 * @return The default metrics.
 */
function getDefaultMetrics(): ReportChartMetric[] {
	return [
		{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) },
		{ key: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
		{ key: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ) },
		{ key: 'likes', label: __( 'Likes', 'jetpack-premium-analytics' ) },
	];
}

export interface ReportPerformanceChartProps {
	/** Section heading (defaults to "Performance"). */
	title?: string;
	/** The current-period visits time-series report (`useStatsVisits().primary.data`). */
	primary?: StatsTimeSeriesReport;
	/** The previous-period report (`useStatsVisits().comparison.data`), when comparison is on. */
	comparison?: StatsTimeSeriesReport;
	/** Whether to show the loading overlay over the chart. */
	isLoading?: boolean;
	/** The metrics offered on the chart; defaults to Views/Visitors/Comments/Likes. */
	metrics?: ReportChartMetric[];
	/** The active time bucket. Owned by the page — it changes the query. */
	interval: IntervalType;
	/** Called when the user picks a different time bucket. */
	onIntervalChange?: ( interval: IntervalType ) => void;
	/** The offered time buckets (defaults to day/week/month). */
	intervalOptions?: IntervalType[];
	/** Value/axis format (defaults to compact numbers). */
	dataFormat?: DataFormat;
	/** Extra header-right controls, rendered before the built-in ones. */
	controls?: ReactNode;
}

/**
 * The chart body. Split out so `useSeriesStyles` runs under the
 * `GlobalChartsProvider` mounted by the section (there is no `WidgetRoot`
 * above report-page components).
 *
 * @param {object}                       props            - The component props.
 * @param {ComparativeLineChartSeries[]} props.series     - The series to draw.
 * @param {DataFormat}                   props.dataFormat - Value/axis format.
 * @return The chart.
 */
function ChartCanvas( {
	series,
	dataFormat,
}: {
	series: ComparativeLineChartSeries[];
	dataFormat: DataFormat;
} ) {
	const seriesStyles = useSeriesStyles( series );

	return (
		<ComparativeLineChart series={ series } styles={ seriesStyles } dataFormat={ dataFormat } />
	);
}

/**
 * The report page's multi-metric performance section: a card with the
 * Views/Visitors/Comments/Likes series drawn together, a metric show/hide
 * menu, the time-bucket selector, and a chart collapse toggle. The page owns
 * data fetching (`useStatsVisits`) and the interval, and passes the reports in.
 *
 * With a single visible metric and comparison data present, the previous
 * period renders as a dashed overlay (see `buildReportMetricSeries`).
 *
 * @param {ReportPerformanceChartProps} props - The component props.
 * @return The performance chart section.
 */
export function ReportPerformanceChart( {
	title = __( 'Performance', 'jetpack-premium-analytics' ),
	primary,
	comparison,
	isLoading = false,
	metrics,
	interval,
	onIntervalChange,
	intervalOptions = DEFAULT_INTERVAL_OPTIONS,
	dataFormat = DEFAULT_DATA_FORMAT,
	controls,
}: ReportPerformanceChartProps ) {
	const chartTheme = useChartTheme();
	const allMetrics = useMemo( () => metrics ?? getDefaultMetrics(), [ metrics ] );
	const [ hiddenMetricKeys, setHiddenMetricKeys ] = useState< string[] >( [] );
	const [ isChartHidden, setIsChartHidden ] = useState( false );

	const visibleMetrics = useMemo(
		() => allMetrics.filter( metric => ! hiddenMetricKeys.includes( metric.key ) ),
		[ allMetrics, hiddenMetricKeys ]
	);

	const series = useMemo(
		() => buildReportMetricSeries( { primary, comparison, metrics: visibleMetrics } ),
		[ primary, comparison, visibleMetrics ]
	);

	const toggleMetric = ( key: string ) => {
		setHiddenMetricKeys( current => {
			if ( current.includes( key ) ) {
				return current.filter( hidden => hidden !== key );
			}
			// Keep at least one metric visible so the chart never goes blank.
			if ( allMetrics.length - current.length <= 1 ) {
				return current;
			}
			return [ ...current, key ];
		} );
	};

	const intervalSelectOptions = intervalOptions.map( value => ( {
		value,
		label: INTERVAL_LABELS[ value ] ?? value,
	} ) );

	return (
		<ReportPageSection className={ styles.root }>
			<div className={ styles.header }>
				<Text variant="heading-md" render={ <h3 /> }>
					{ title }
				</Text>
				<div className={ styles.controls }>
					{ controls }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Chart interval', 'jetpack-premium-analytics' ) }
						hideLabelFromVision
						value={ interval }
						options={ intervalSelectOptions }
						onChange={ value => onIntervalChange?.( value as IntervalType ) }
					/>
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Chart options', 'jetpack-premium-analytics' ) }
						popoverProps={ { placement: 'bottom-end' } }
					>
						{ () => (
							<MenuGroup label={ __( 'Metrics', 'jetpack-premium-analytics' ) }>
								{ allMetrics.map( metric => {
									const isVisible = ! hiddenMetricKeys.includes( metric.key );
									return (
										<MenuItem
											key={ metric.key }
											role="menuitemcheckbox"
											isSelected={ isVisible }
											icon={ isVisible ? check : undefined }
											onClick={ () => toggleMetric( metric.key ) }
										>
											{ metric.label }
										</MenuItem>
									);
								} ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				</div>
			</div>
			{ ! isChartHidden && (
				<div className={ styles.chart }>
					<GlobalChartsProvider theme={ chartTheme }>
						<ChartCanvas series={ series } dataFormat={ dataFormat } />
					</GlobalChartsProvider>
					{ isLoading && <WidgetLoadingOverlay /> }
				</div>
			) }
			<div className={ styles.footer }>
				<Button
					variant="tertiary"
					size="compact"
					onClick={ () => setIsChartHidden( current => ! current ) }
				>
					{ isChartHidden
						? __( 'Show chart', 'jetpack-premium-analytics' )
						: __( 'Hide chart', 'jetpack-premium-analytics' ) }
				</Button>
			</div>
		</ReportPageSection>
	);
}
