/**
 * External dependencies
 */
import {
	buildMetricTab,
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	useWidgetRootContext,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import {
	BOOKINGS_FILTER,
	useReportConversionRate,
	useReportCustomersByDate,
	useReportOrders,
	useReportVisitors,
} from '../../src/reports';
import {
	DEFAULT_STORE_PERFORMANCE_METRICS,
	STORE_PERFORMANCE_METRICS,
	type StorePerformanceMetricId,
} from './metrics';
import styles from './store-performance.module.css';
import type { StorePerformanceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** Chart format for the metrics that set none. */
const DEFAULT_DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type StorePerformanceRenderAttributes = StorePerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;

type StorePerformanceProps = {
	/** The metrics shown, by id. */
	metricIds: StorePerformanceMetricId[];
};

/**
 * The selected store metrics as tabs over a comparison line chart, read under the widget root
 * for its report params. Only the reports those metrics read are requested.
 *
 * @param {StorePerformanceProps} props - The component props.
 * @return {JSX.Element} The chart, or the loading or error state of its reports.
 */
function StorePerformance( { metricIds }: StorePerformanceProps ) {
	const { reportParams } = useWidgetRootContext();
	const bookingsParams = useMemo(
		() => ( { ...reportParams, filters: [ BOOKINGS_FILTER ] } ),
		[ reportParams ]
	);

	// Resolved against the list, so the tab order holds whatever order the ids were picked in.
	const visibleMetrics = useMemo( () => {
		const selected = new Set( metricIds );
		return STORE_PERFORMANCE_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metricIds ] );
	const sources = useMemo(
		() => new Set( visibleMetrics.map( metric => metric.source ) ),
		[ visibleMetrics ]
	);

	const orders = useReportOrders( reportParams, { enabled: sources.has( 'orders' ) } );
	const bookings = useReportOrders( bookingsParams, { enabled: sources.has( 'bookings' ) } );
	const visitors = useReportVisitors( reportParams, { enabled: sources.has( 'visitors' ) } );
	const conversion = useReportConversionRate( reportParams, {
		enabled: sources.has( 'conversion' ),
	} );
	const customers = useReportCustomersByDate( reportParams, {
		enabled: sources.has( 'customers' ),
	} );

	const reports = useMemo(
		() => ( { orders, bookings, visitors, conversion, customers } ),
		[ orders, bookings, visitors, conversion, customers ]
	);
	// The reports the shown metrics read: a switched-off report has no state to show.
	const reportList = useMemo(
		() => Array.from( sources, source => reports[ source ] ),
		[ reports, sources ]
	);

	const metrics = useMemo(
		() =>
			visibleMetrics.map( metric => {
				const report = reports[ metric.source ];

				return {
					...buildMetricTab( {
						primary: report.primary.data,
						comparison: report.comparison.data,
						hasComparison: report.hasComparison,
						field: metric.field,
						label: metric.label,
						dataFormat: metric.dataFormat,
						countLabel: metric.countLabel,
						zone: report.timezone,
					} ),
					key: metric.id,
					description: metric.description,
				};
			} ),
		[ reports, visibleMetrics ]
	);

	// A failed report shows its error beside the others' charts only once it has nothing to show.
	const isError = reportList.some( report => report.isError && ! report.hasData );
	// Retry re-runs every report, not only the failed one.
	const refetch = useCallback(
		() => Promise.all( reportList.map( report => report.refetch() ) ),
		[ reportList ]
	);

	// Not a data state: every metric was switched off in the widget settings.
	if ( visibleMetrics.length === 0 ) {
		return (
			<div className={ styles.root }>
				<ChartEmptyState
					text={ __( 'Select at least one metric to display.', 'jetpack-woocommerce-stats-pkg' ) }
				/>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ reportList.some( report => report.isLoading ) }
				isFetching={ reportList.some( report => report.isFetching ) }
				isError={ isError }
				error={ {
					description: __(
						"We couldn't load store performance data. Please try again in a moment.",
						'jetpack-woocommerce-stats-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-woocommerce-stats-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metrics }
					dataFormat={ DEFAULT_DATA_FORMAT }
					groupLabel={ __( 'Store metric', 'jetpack-woocommerce-stats-pkg' ) }
					empty={ <ChartEmptyState /> }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * The Store performance widget. A missing `metrics` attribute shows every metric but Bookings.
 *
 * @param {WidgetRenderProps< StorePerformanceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function StorePerformanceRender( {
	attributes = {},
}: WidgetRenderProps< StorePerformanceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<StorePerformance metricIds={ attributes.metrics ?? DEFAULT_STORE_PERFORMANCE_METRICS } />
		</WidgetRoot>
	);
}
