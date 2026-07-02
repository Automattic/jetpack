/**
 * Components
 */
export {
	MetricDelta,
	MetricWithComparison,
	ComparativeLineChart,
	DonutChart,
	Legend,
	ReportMetricWidget,
	MetricTabsChart,
	type MetricTab,
	type MetricTabDatum,
	type MetricTabsChartProps,
	WidgetRoot,
	WidgetRootContext,
	useWidgetRootContext,
	type DonutChartData,
	type WidgetRootContextValue,
	type LegendItem,
	type SeriesStyle,
	LeaderboardChart,
	type LeaderboardChartProps,
	type LeaderboardChartData,
	type LegendLabels,
	LeaderboardLabel,
	type LeaderboardLabelProps,
	BarChart,
	type BarChartProps,
	type BarChartData,
	type BarChartStyle,
	WidgetLoadingOverlay,
	SubscriberList,
	type SubscriberListItem,
	type SubscriberListProps,
	SemiCircleChart,
	type SemiCircleChartData,
} from './components';

/**
 * Constants
 */
export { WOO_COLORS, COLOR_GRAY_100 } from './constants';

/**
 * Widget edit fields
 */
export {
	ReportParamsField,
	type ReportParamsFieldAttributes,
	MetricsField,
	DEFAULT_METRICS,
} from './fields';

/**
 * Helpers and utilities
 */
export {
	formatOrderMetric,
	getFormatByMetricKey,
	buildTimeSeriesChartData,
	type TimeSeriesData,
	calculateDelta,
	flagUrl,
	BOOKINGS_FILTER,
	PHYSICAL_PRODUCTS_FILTER,
	FULFILLED_ORDERS_FILTER,
	UNFULFILLED_ORDERS_FILTER,
	PAYMENT_STATUS_FILTERS,
	buildPaymentStatusData,
	type PaymentStatusData,
	buildSalesByUtmData,
	formatLegendLabels,
	formatDisplayLabel,
} from './helpers';

/**
 * Hooks
 */
export {
	useAttributesWithSearchFallback,
	useChartTheme,
	useSegmentStyles,
	useSeriesStyles,
	useWidgetError,
} from './hooks';

/**
 * Widget components
 */
export {
	BookingOrderMetricWidget,
	BookingsByAttendanceWidget,
	BookingsRevenueByCustomerTypeWidget,
	BookingConversionRateWidget,
	ConversionRateWidget,
	CouponUseWidget,
	MetricComparisonWidget,
	RevenueByCustomerTypeWidget,
	NewVsReturningCustomerWidget,
	OrderMetricWidget,
	OrdersFulfillmentWidget,
	SalesByCouponWidget,
	TotalReturnsWidget,
	VisitorsByLocationWidget,
	SalesByDeviceWidget,
	SalesByUtmWidget,
	SessionsByDeviceWidget,
	TopPerformingProductLeaderboardWidget,
	type TopPerformingProductLeaderboardWidgetProps,
	TopPerformingProductsWidget,
	type TopPerformingProductsWidgetProps,
	TopPerformingBookingsWidget,
	type TopPerformingBookingsWidgetProps,
} from './widgets';

/**
 * Types
 */
export type { OrderMetricKey, OrderMetrics, OrdersSummary, DataFormat } from './types';
