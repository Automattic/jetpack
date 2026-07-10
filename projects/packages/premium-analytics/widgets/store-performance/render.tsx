import {
	useReportCustomersByDate,
	useReportConversionRate,
	useReportOrders,
	useReportVisitors,
	type ReportDataMap,
} from '@jetpack-premium-analytics/data';
import {
	BOOKINGS_FILTER,
	MetricTabsChart,
	WidgetRoot,
	WidgetLoadingOverlay,
	buildTimeSeriesChartData,
	getFormatByMetricKey,
	useWidgetError,
	useWidgetRootContext,
	type MetricTab,
	type ReportParamsFieldAttributes,
	type TimeSeriesData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import {
	DEFAULT_STORE_PERFORMANCE_METRICS,
	STORE_PERFORMANCE_METRICS,
	type StorePerformanceMetric,
	type StorePerformanceMetricId,
} from './metrics';
import styles from './styles.module.scss';
import type { StorePerformanceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

/** Fallback chart format; each metric supplies its own via `getFormatByMetricKey`. */
const DEFAULT_DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

// Report params (date range + comparison) arrive from the host via WidgetRoot;
// the widget's own `metrics` attribute selects which store metrics render as
// tabs. `setError` surfaces load failures in the dashboard frame, matching the
// other analytics widgets.
type StorePerformanceRenderAttributes = StorePerformanceAttributes &
	Partial< ReportParamsFieldAttributes >;

type StorePerformanceRenderProps = WidgetRenderProps< StorePerformanceRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/** The `{ primary, comparison }` pair every report hook returns. */
type ReportPair< H extends ( ...args: never[] ) => { primary: unknown; comparison: unknown } > =
	Pick< ReturnType< H >, 'primary' | 'comparison' >;

type DataSources = {
	general: ReportPair< typeof useReportOrders >;
	booking: ReportPair< typeof useReportOrders >;
	visitors: ReportPair< typeof useReportVisitors >;
	conversion: ReportPair< typeof useReportConversionRate >;
	customers: ReportPair< typeof useReportCustomersByDate >;
};

function getDefaultOrdersReportData(): ReportDataMap[ 'orders' ] {
	return {
		summary: {
			date_start: '',
			date_end: '',
			total_sales: 0,
			orders_no: 0,
			avg_items: 0,
			average_order_value: 0,
			orders_value_net: 0,
			orders_value_gross: 0,
			product_net_revenue: 0,
			profit_margin: 0,
			cogs_amount: 0,
			coupons: 0,
			refunds: 0,
			paid_orders_count: 0,
			paid_net_sales: 0,
			unpaid_orders_count: 0,
			unpaid_net_sales: 0,
		},
		data: [],
	};
}

function getDefaultVisitorsReportData(): ReportDataMap[ 'visitors' ] {
	return {
		summary: {
			date_start: '',
			date_end: '',
			active_sessions: 0,
			visitors: 0,
		},
		data: [],
	};
}

function getDefaultConversionReportData(): ReportDataMap[ 'conversionRate' ] {
	return {
		summary: {
			date_start: '',
			date_end: '',
			active_sessions: 0,
			visitors: 0,
			with_cart_addition: 0,
			reached_checkout: 0,
			completed_checkout: 0,
			conversion_rate: 0,
		},
		data: [],
		steps: [],
		overallRate: 0,
	};
}

function getDefaultCustomersReportData(): ReportDataMap[ 'customersByDate' ] {
	return {
		summary: {
			total_net_sales: 0,
			total_gross_sales: 0,
			total_discounts: 0,
			total_refunds: 0,
			total_orders: 0,
			total_average_order_value: 0,
			total_avg_items_per_order: 0,
			total_customers: 0,
			new_customers: 0,
			returning_customers: 0,
			new_customer_sales: 0,
			new_customer_gross_sales: 0,
			new_customer_discounts: 0,
			new_customer_refunds: 0,
			new_customer_orders: 0,
			new_customer_avg_order_value: 0,
			new_customer_avg_items_per_order: 0,
			returning_customer_sales: 0,
			returning_customer_gross_sales: 0,
			returning_customer_discounts: 0,
			returning_customer_refunds: 0,
			returning_customer_orders: 0,
			returning_customer_avg_order_value: 0,
			returning_customer_avg_items_per_order: 0,
			date_start: '',
			date_end: '',
			customers: 0,
		},
		data: [],
	};
}

function buildSeriesForMetric( metric: StorePerformanceMetric, dataSources: DataSources ) {
	if ( metric.metricType === 'visitors' ) {
		return buildTimeSeriesChartData< TimeSeriesData >( {
			primary: dataSources.visitors.primary.data ?? getDefaultVisitorsReportData(),
			comparison: dataSources.visitors.comparison.data ?? getDefaultVisitorsReportData(),
			metricKey: metric.metricKey,
			emptyDataFallback: 'empty-array',
		} );
	}

	if ( metric.metricType === 'conversion' ) {
		return buildTimeSeriesChartData< TimeSeriesData >( {
			primary: dataSources.conversion.primary.data ?? getDefaultConversionReportData(),
			comparison: dataSources.conversion.comparison.data ?? getDefaultConversionReportData(),
			metricKey: metric.metricKey,
			emptyDataFallback: 'empty-array',
		} );
	}

	if ( metric.metricType === 'customers' ) {
		return buildTimeSeriesChartData< TimeSeriesData >( {
			primary: dataSources.customers.primary.data ?? getDefaultCustomersReportData(),
			comparison: dataSources.customers.comparison.data ?? getDefaultCustomersReportData(),
			metricKey: metric.metricKey,
			emptyDataFallback: 'empty-array',
		} );
	}

	const source = metric.metricType === 'booking' ? dataSources.booking : dataSources.general;

	return buildTimeSeriesChartData< TimeSeriesData >( {
		primary: source.primary.data ?? getDefaultOrdersReportData(),
		comparison: source.comparison.data ?? getDefaultOrdersReportData(),
		metricKey: metric.metricKey,
		emptyDataFallback: 'empty-array',
	} );
}

function StorePerformanceContent( {
	metricIds = DEFAULT_STORE_PERFORMANCE_METRICS,
}: {
	metricIds?: StorePerformanceMetricId[];
} ) {
	const { reportParams } = useWidgetRootContext();

	// Resolve selected ids against the canonical definitions so the tab order
	// stays stable regardless of the order the ids were toggled in.
	const enabledMetrics = useMemo( () => {
		const selected = new Set( metricIds );
		return STORE_PERFORMANCE_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metricIds ] );
	const metricTypes = useMemo(
		() => new Set( enabledMetrics.map( metric => metric.metricType ) ),
		[ enabledMetrics ]
	);

	const generalReport = useReportOrders( reportParams, {
		enabled: metricTypes.has( 'general' ),
	} );
	const { primary, comparison } = generalReport;

	const bookingsReport = useReportOrders(
		{
			...reportParams,
			filters: [ BOOKINGS_FILTER ],
		},
		{
			enabled: metricTypes.has( 'booking' ),
		}
	);
	const { primary: bookingsPrimary, comparison: bookingsComparison } = bookingsReport;

	const visitorsReport = useReportVisitors( reportParams, {
		enabled: metricTypes.has( 'visitors' ),
	} );
	const { primary: visitorsPrimary, comparison: visitorsComparison } = visitorsReport;

	const conversionReport = useReportConversionRate( reportParams, {
		enabled: metricTypes.has( 'conversion' ),
	} );
	const { primary: conversionPrimary, comparison: conversionComparison } = conversionReport;

	const customersReport = useReportCustomersByDate( reportParams, {
		enabled: metricTypes.has( 'customers' ),
	} );
	const { primary: customersPrimary, comparison: customersComparison } = customersReport;

	const activeReports = useMemo(
		() =>
			[
				metricTypes.has( 'general' ) ? generalReport : null,
				metricTypes.has( 'booking' ) ? bookingsReport : null,
				metricTypes.has( 'visitors' ) ? visitorsReport : null,
				metricTypes.has( 'conversion' ) ? conversionReport : null,
				metricTypes.has( 'customers' ) ? customersReport : null,
			].filter( report => report !== null ),
		[
			metricTypes,
			generalReport,
			bookingsReport,
			visitorsReport,
			conversionReport,
			customersReport,
		]
	);
	const isError = activeReports.some( report => report.isError );
	const error = activeReports.map( report => report.error ).find( Boolean ) ?? null;
	const refetch = useCallback(
		() => Promise.all( activeReports.map( report => report.refetch() ) ),
		[ activeReports ]
	);

	// Surfaces load failures in the dashboard frame (notice + Retry) and logs the
	// underlying error; shared with every other analytics widget.
	const hasError = useWidgetError( isError, error, refetch );

	const enrichedMetrics = useMemo(
		() =>
			enabledMetrics.map( metric => {
				type Summary = Record< string, string | number >;
				const getMetricSummaries = (): [ Summary, Summary ] => {
					if ( metric.metricType === 'booking' ) {
						return [ bookingsPrimary.data?.summary ?? {}, bookingsComparison.data?.summary ?? {} ];
					}

					if ( metric.metricType === 'visitors' ) {
						return [ visitorsPrimary.data?.summary ?? {}, visitorsComparison.data?.summary ?? {} ];
					}

					if ( metric.metricType === 'conversion' ) {
						return [
							conversionPrimary.data?.summary ?? {},
							conversionComparison.data?.summary ?? {},
						];
					}

					if ( metric.metricType === 'customers' ) {
						return [
							customersPrimary.data?.summary ?? {},
							customersComparison.data?.summary ?? {},
						];
					}

					return [ primary.data?.summary ?? {}, comparison.data?.summary ?? {} ];
				};

				const [ primarySummary, comparisonSummary ] = getMetricSummaries();

				return {
					...metric,
					primary: Number( primarySummary[ metric.metricKey ] ?? 0 ),
					comparison:
						comparisonSummary[ metric.metricKey ] !== undefined
							? Number( comparisonSummary[ metric.metricKey ] )
							: null,
				};
			} ),
		[
			enabledMetrics,
			bookingsPrimary.data,
			bookingsComparison.data,
			visitorsPrimary.data,
			visitorsComparison.data,
			conversionPrimary.data,
			conversionComparison.data,
			customersPrimary.data,
			customersComparison.data,
			primary.data,
			comparison.data,
		]
	);

	const dataSources: DataSources = useMemo(
		() => ( {
			general: { primary, comparison },
			booking: { primary: bookingsPrimary, comparison: bookingsComparison },
			visitors: { primary: visitorsPrimary, comparison: visitorsComparison },
			conversion: { primary: conversionPrimary, comparison: conversionComparison },
			customers: { primary: customersPrimary, comparison: customersComparison },
		} ),
		[
			primary,
			comparison,
			bookingsPrimary,
			bookingsComparison,
			visitorsPrimary,
			visitorsComparison,
			conversionPrimary,
			conversionComparison,
			customersPrimary,
			customersComparison,
		]
	);

	// One tab per enabled metric; MetricTabsChart owns selection and the
	// responsive tabs↔dropdown and chart↔sparkline switches.
	const metricTabs: MetricTab[] = useMemo(
		() =>
			enrichedMetrics.map( metric => {
				const series = buildSeriesForMetric( metric, dataSources );
				return {
					key: metric.id,
					label: metric.label,
					value: metric.primary,
					previousValue: metric.comparison,
					current: series[ 0 ]?.data ?? [],
					previous: series[ 1 ]?.data,
					dataFormat: getFormatByMetricKey( metric.metricKey ),
					description: metric.description,
				};
			} ),
		[ enrichedMetrics, dataSources ]
	);

	if ( hasError ) {
		return null; // Dashboard shows error UI via WidgetErrorBoundary.
	}

	const isInitialLoading = activeReports.some( report => report.isLoading && ! report.hasData );

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	if ( ! metricTabs.length ) {
		return (
			<div className={ styles.emptyState }>
				{ __(
					'No metric selected. Please select a metric from the metrics list.',
					'jetpack-premium-analytics'
				) }
			</div>
		);
	}

	const isRefetching = activeReports.some( report => report.isFetching && report.hasData );

	return (
		<div className={ styles.widgetRoot }>
			<MetricTabsChart
				metrics={ metricTabs }
				dataFormat={ DEFAULT_DATA_FORMAT }
				loading={ isRefetching }
				groupLabel={ __( 'Store metric', 'jetpack-premium-analytics' ) }
			/>
		</div>
	);
}

/**
 * Store performance widget.
 *
 * Ported from the upstream analytics-at-a-glance widget. WidgetRoot provides
 * the query client, chart theme, and resolved report params; the local content
 * component renders the metrics selected by the `metrics` attribute with a
 * comparison line chart.
 */
export default function StorePerformanceRender( {
	attributes = {},
	setError,
}: StorePerformanceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<StorePerformanceContent metricIds={ attributes.metrics } />
		</WidgetRoot>
	);
}
