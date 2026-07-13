/**
 * Components
 */
export {
	MetricDelta,
	MetricValue,
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
	WidgetState,
	type WidgetStateProps,
	type WidgetStateError,
	type WidgetStateEmpty,
	WidgetBackLink,
	type WidgetBackLinkProps,
	SubscriberList,
	type SubscriberListItem,
	type SubscriberListProps,
	SemiCircleChart,
	type SemiCircleChartData,
	ReportPageLayout,
	ReportPageSection,
	ReportPageTabPanel,
	ReportPageTabs,
	ReportPerformanceChart,
	ReportRecordsTable,
	buildReportMetricSeries,
	type ReportChartMetric,
	type ReportPageLayoutProps,
	type ReportPageSectionProps,
	type ReportPageTab,
	type ReportPageTabPanelProps,
	type ReportPageTabsProps,
	type ReportPerformanceChartProps,
	type ReportRecordsTableProps,
} from './components';

/**
 * Constants
 */
export { WOO_COLORS, COLOR_GRAY_100 } from './constants';

/**
 * Widget edit fields
 */
export { ReportParamsField, type ReportParamsFieldAttributes } from './fields';

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
	getVideoKey,
	getVideoLabel,
	toVideoItems,
	toMaxRows,
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
	useWidgetDrillDown,
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
export type { MetricKey, OrderMetricKey, OrderMetrics, OrdersSummary, DataFormat } from './types';

/**
 * Charts passthrough
 *
 * Widgets must import chart components from here, never from
 * `@automattic/charts` directly: the toolkit is a shared script module, so
 * charts is bundled once instead of once per widget.
 */
export {
	GeoChart,
	GlobalChartsProvider,
	HeatmapChart,
	buildCalendarHeatmapData,
	type DataPointDate,
	type GeoChartError,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
} from '@automattic/charts';
