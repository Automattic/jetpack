import {
	useReportCustomersByDate,
	useReportConversionRate,
	useReportOrders,
	useReportVisitors,
	type ReportDataMap,
} from '@jetpack-premium-analytics/data';
import {
	ComparativeLineChart,
	DEFAULT_METRICS,
	MetricWithComparison,
	WidgetRoot,
	WidgetLoadingOverlay,
	buildTimeSeriesChartData,
	getFormatByMetricKey,
	useSeriesStyles,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
	type TimeSeriesData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Stack, Tabs, Tooltip } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './styles.module.scss';

type StorePerformanceMetric = ( typeof DEFAULT_METRICS )[ number ];

type StorePerformanceAttributes = Partial< ReportParamsFieldAttributes > & {
	metrics?: StorePerformanceMetric[];
};

type StorePerformanceRenderProps = {
	attributes?: StorePerformanceAttributes;
};

type OrdersByDateResponse = ReportDataMap[ 'orders' ];

type DataSources = {
	general: {
		primary: ReturnType< typeof useReportOrders >[ 'primary' ];
		comparison: ReturnType< typeof useReportOrders >[ 'comparison' ];
	};
	booking: {
		primary: ReturnType< typeof useReportOrders >[ 'primary' ];
		comparison: ReturnType< typeof useReportOrders >[ 'comparison' ];
	};
	visitors: {
		primary: ReturnType< typeof useReportVisitors >[ 'primary' ];
		comparison: ReturnType< typeof useReportVisitors >[ 'comparison' ];
	};
	conversion: {
		primary: ReturnType< typeof useReportConversionRate >[ 'primary' ];
		comparison: ReturnType< typeof useReportConversionRate >[ 'comparison' ];
	};
	customers: {
		primary: ReturnType< typeof useReportCustomersByDate >[ 'primary' ];
		comparison: ReturnType< typeof useReportCustomersByDate >[ 'comparison' ];
	};
};

type MetricTabProps = {
	id: string;
	metricKey: StorePerformanceMetric[ 'metricKey' ];
	value: number;
	label: StorePerformanceMetric[ 'label' ];
	previousValue?: number | null;
	description?: StorePerformanceMetric[ 'description' ];
};

function getDefaultOrdersReportData(): OrdersByDateResponse {
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

function buildSeriesForMetric(
	metric: StorePerformanceMetric | undefined,
	dataSources: DataSources
) {
	if ( ! metric ) {
		return [];
	}

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

function MetricTab( { id, metricKey, label, value, previousValue, description }: MetricTabProps ) {
	return (
		<Tabs.Tab value={ id } className={ styles.metricTab }>
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<Stack
							direction="column"
							gap="sm"
							className={ styles.metricTabContent }
							align="left"
							justify="start"
						>
							<span className={ styles.metricTabLabel }>{ label }</span>

							<MetricWithComparison
								value={ value }
								previousValue={ previousValue }
								dataFormat={ getFormatByMetricKey( metricKey ) }
							/>
						</Stack>
					}
				/>
				<Tooltip.Popup align="start" side="bottom" className={ styles.metricTabDescription }>
					{ description }
				</Tooltip.Popup>
			</Tooltip.Root>
		</Tabs.Tab>
	);
}

function StorePerformanceContent( {
	metrics = DEFAULT_METRICS,
}: {
	metrics?: StorePerformanceMetric[];
} ) {
	const { reportParams, setError } = useWidgetRootContext();

	const enabledMetrics = useMemo( () => metrics.filter( metric => metric.enabled ), [ metrics ] );
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
			filters: [
				{
					compare: 'IN',
					key: 'product_type',
					value: [ 'booking', 'bookable-event', 'bookable-service' ],
				},
			],
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
		[ metricTypes, generalReport, bookingsReport, visitorsReport, conversionReport, customersReport ]
	);
	const isInitialLoading = activeReports.some( report => report.isLoading && ! report.hasData );
	const isRefetching = activeReports.some( report => report.isFetching && report.hasData );
	const isError = activeReports.some( report => report.isError );
	const refetch = useCallback(
		() => Promise.all( activeReports.map( report => report.refetch() ) ),
		[ activeReports ]
	);

	useEffect( () => {
		if ( ! isError ) {
			setError?.( null );
			return;
		}

		setError?.( {
			message: __(
				"We couldn't load this data. Please try again in a moment.",
				'jetpack-premium-analytics'
			),
			action: {
				label: __( 'Retry', 'jetpack-premium-analytics' ),
				onClick: () => {
					setError?.( null );
					void refetch();
				},
			},
		} );
	}, [ isError, setError, refetch ] );

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
					id: `${ metric.metricType }-${ metric.metricKey }`,
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

	const [ selectedMetricId, setSelectedMetricId ] = useState< string >();
	const handleTabValueChange = useCallback( ( value: string ) => {
		setSelectedMetricId( value );
	}, [] );
	const currentMetric =
		enrichedMetrics.find( metric => metric.id === selectedMetricId ) ?? enrichedMetrics[ 0 ];

	const chartSeries = buildSeriesForMetric( currentMetric, {
		general: { primary, comparison },
		booking: { primary: bookingsPrimary, comparison: bookingsComparison },
		visitors: { primary: visitorsPrimary, comparison: visitorsComparison },
		conversion: {
			primary: conversionPrimary,
			comparison: conversionComparison,
		},
		customers: {
			primary: customersPrimary,
			comparison: customersComparison,
		},
	} );

	const seriesStyles = useSeriesStyles( chartSeries );

	if ( isError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<Tabs.Root
			defaultValue={ enrichedMetrics[ 0 ]?.id }
			value={ currentMetric?.id }
			className={ styles.widgetRoot }
			onValueChange={ handleTabValueChange }
		>
			<Stack gap="lg" direction="column" justify="center" className={ styles.widgetBody }>
				{ currentMetric && (
					<div className={ styles.metricTabsContainer }>
						<Tabs.List className={ styles.metricTabsList }>
							{ enrichedMetrics.map( metric => (
								<MetricTab
									id={ metric.id }
									key={ metric.id }
									metricKey={ metric.metricKey }
									label={ metric.label }
									description={ metric.description }
									value={ metric.primary }
									previousValue={ metric.comparison }
								/>
							) ) }
						</Tabs.List>
					</div>
				) }

				{ enrichedMetrics.map( metric => (
					<Tabs.Panel
						key={ metric.id }
						value={ metric.id }
						focusable={ false }
						className={ styles.chartPanel }
					>
						{ metric.id === currentMetric?.id && chartSeries.length > 0 && (
							<ComparativeLineChart
								series={ chartSeries }
								styles={ seriesStyles }
								dataFormat={ getFormatByMetricKey( currentMetric.metricKey ) }
							/>
						) }
					</Tabs.Panel>
				) ) }

				{ isRefetching && <WidgetLoadingOverlay /> }

				{ ! currentMetric && (
					<Stack direction="column" align="center" justify="center" className={ styles.emptyState }>
						{ __(
							'No metric selected. Please select a metric from the metrics list.',
							'jetpack-premium-analytics'
						) }
					</Stack>
				) }
			</Stack>
		</Tabs.Root>
	);
}

/**
 * Store performance widget.
 *
 * Ported from the upstream analytics-at-a-glance widget. WidgetRoot provides
 * the query client, chart theme, and resolved report params; the local content
 * component renders selectable metrics with a comparison line chart.
 */
export default function StorePerformanceRender( { attributes }: StorePerformanceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } options={ { from: '/' } }>
			<StorePerformanceContent metrics={ attributes?.metrics } />
		</WidgetRoot>
	);
}
