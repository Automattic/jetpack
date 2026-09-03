/**
 * External dependencies
 */
import { Text } from '@jetpack-premium-analytics/externals';
import { Button, DropdownMenu, MenuGroup, MenuItem, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, moreVertical } from '@wordpress/icons';
import { useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { useSeriesStyles } from '../../hooks';
import { ComparativeLineChart } from '../chart-comparative-line';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import { ReportPageSection } from './report-page-layout';
import styles from './report-performance-chart.module.scss';
import { buildReportMetricSeries } from './utils/build-report-metric-series';
import type { ReportChartMetric } from './types';
import type { DataFormat } from '../../types';
import type { IntervalType, StatsTimeSeriesReport } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

const DEFAULT_DATA_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

const INTERVAL_LABELS: Partial< Record< IntervalType, string > > = {
	day: __( 'By days', 'jetpack-premium-analytics-pkg' ),
	week: __( 'By weeks', 'jetpack-premium-analytics-pkg' ),
	month: __( 'By months', 'jetpack-premium-analytics-pkg' ),
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
		{ key: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
		{ key: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
		{ key: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
		{ key: 'likes', label: __( 'Likes', 'jetpack-premium-analytics-pkg' ) },
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
 * The report page's multi-metric performance section: the series drawn together with
 * a metric show/hide menu, the time-bucket selector, and a collapse toggle.
 *
 * Chart theming comes from the `GlobalChartsProvider` the `/reports/$report` stage
 * mounts, so this must render under that stage — or its own provider in Storybook.
 */
export function ReportPerformanceChart( {
	title = __( 'Performance', 'jetpack-premium-analytics-pkg' ),
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
	const seriesStyles = useSeriesStyles( series );

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
						label={ __( 'Chart interval', 'jetpack-premium-analytics-pkg' ) }
						hideLabelFromVision
						value={ interval }
						options={ intervalSelectOptions }
						onChange={ value => onIntervalChange?.( value as IntervalType ) }
					/>
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Chart options', 'jetpack-premium-analytics-pkg' ) }
						popoverProps={ { placement: 'bottom-end' } }
					>
						{ () => (
							<MenuGroup label={ __( 'Metrics', 'jetpack-premium-analytics-pkg' ) }>
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
					{ ( ! isLoading || series.length > 0 ) && (
						<ComparativeLineChart
							series={ series }
							styles={ seriesStyles }
							dataFormat={ dataFormat }
						/>
					) }
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
						? __( 'Show chart', 'jetpack-premium-analytics-pkg' )
						: __( 'Hide chart', 'jetpack-premium-analytics-pkg' ) }
				</Button>
			</div>
		</ReportPageSection>
	);
}
