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
import { STORE_PERFORMANCE_METRICS } from './metrics';
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

/**
 * Every store metric as a selectable tab over a comparison line chart, read under the widget
 * root for its report params.
 *
 * @return {JSX.Element} The chart, or the loading or error state of its reports.
 */
function StorePerformance() {
	const { reportParams } = useWidgetRootContext();
	const bookingsParams = useMemo(
		() => ( { ...reportParams, filters: [ BOOKINGS_FILTER ] } ),
		[ reportParams ]
	);

	const orders = useReportOrders( reportParams );
	const bookings = useReportOrders( bookingsParams );
	const visitors = useReportVisitors( reportParams );
	const conversion = useReportConversionRate( reportParams );
	const customers = useReportCustomersByDate( reportParams );

	const reports = useMemo(
		() => ( { orders, bookings, visitors, conversion, customers } ),
		[ orders, bookings, visitors, conversion, customers ]
	);
	const reportList = useMemo( () => Object.values( reports ), [ reports ] );

	const metrics = useMemo(
		() =>
			STORE_PERFORMANCE_METRICS.map( metric => {
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
		[ reports ]
	);

	// A failed report shows its error beside the others' charts only once it has nothing to show.
	const isError = reportList.some( report => report.isError && ! report.hasData );
	// Retry re-runs every report, not only the failed one.
	const refetch = useCallback(
		() => Promise.all( reportList.map( report => report.refetch() ) ),
		[ reportList ]
	);

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
 * The Store performance widget.
 *
 * @param {WidgetRenderProps< StorePerformanceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function StorePerformanceRender( {
	attributes = {},
}: WidgetRenderProps< StorePerformanceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<StorePerformance />
		</WidgetRoot>
	);
}
