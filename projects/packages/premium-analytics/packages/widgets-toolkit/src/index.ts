/**
 * Components
 */
export {
	MetricDelta,
	MetricTileGrid,
	MetricValue,
	MetricWithComparison,
	ComparativeLineChart,
	type ComparativeLineChartSeries,
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
	LeaderboardRow,
	buildLeaderboardRow,
	resolveLeaderboardRowAction,
	type LeaderboardRowAction,
	type LeaderboardRowActionOptions,
	type LeaderboardRowChartProps,
	type LeaderboardRowMedia,
	type LeaderboardRowProps,
	type LeaderboardRowVariant,
	BarChart,
	type BarChartProps,
	type BarChartData,
	type BarChartStyle,
	WidgetLoadingOverlay,
	ChartEmptyState,
	type ChartEmptyStateProps,
	WidgetState,
	type WidgetStateProps,
	type WidgetStateError,
	type WidgetStateEmpty,
	WidgetBackLink,
	type WidgetBackLinkProps,
	WidgetFooter,
	type WidgetFooterProps,
	ReportLink,
	type ReportLinkProps,
	PostTitleLink,
	POST_URL_SEARCH_PARAM,
	type PostTitleLinkProps,
	LeaderboardPostLabel,
	type LeaderboardPostLabelProps,
	type LeaderboardPostLabelVariant,
	VideoTitleLink,
	type VideoTitleLinkProps,
	SubscriberList,
	type SubscriberListItem,
	type SubscriberListProps,
	SemiCircleChart,
	type SemiCircleChartData,
	ReportDrilldownTable,
	ReportErrorState,
	ReportPageLayout,
	ReportPageSection,
	ReportPageShell,
	ReportPageTabPanel,
	ReportPageTabs,
	ReportPerformanceChart,
	ReportRecordsTable,
	useReportRetry,
	buildReportMetricSeries,
	type ReportChartMetric,
	type ReportDrilldownTableProps,
	type ReportErrorStateProps,
	type ReportPageLayoutProps,
	type ReportPageSectionProps,
	type ReportPageShellProps,
	type ReportPageTab,
	type ReportPageTabPanelProps,
	type ReportPageTabsProps,
	type ReportPerformanceChartProps,
	type ReportRecordsTableProps,
	ReportCsvAction,
	type ReportCsvActionProps,
	ReportCsvDownloadButton,
	type ReportCsvDownloadButtonProps,
	RowsCsvDownloadButton,
	type RowsCsvDownloadButtonProps,
	useReportCsvExport,
	type UseReportCsvExportOptions,
	type UseReportCsvExportResult,
	WidgetDataTable,
	type WidgetDataTableProps,
	EARNINGS_HISTORY_VIEW,
	flattenEarningsBreakdown,
	getWordAdsHistoryFields,
	type EarningsHistoryRow,
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
	buildCsv,
	buildCsvDateRangeFilename,
	saveCsv,
	type CsvColumn,
	type CsvDateRange,
	getCombinedPeriodMax,
	sharePercentage,
	getVideoKey,
	getVideoLabel,
	toMaxRows,
	describeError,
	summaryCount,
	toDay,
	defaultPeriodForInterval,
	buildMetricTab,
} from './helpers';

/**
 * Hooks
 */
export {
	useAttributesWithSearchFallback,
	useChartTheme,
	useElementSize,
	type ElementSize,
	useSegmentStyles,
	useSeriesStyles,
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
 * charts is bundled once instead of once per widget. The toolkit itself takes
 * charts from `@jetpack-premium-analytics/externals`, which is where the
 * library is actually compiled in.
 */
export {
	GeoChart,
	GlobalChartsProvider,
	HeatmapChart,
	HeatmapChartUnresponsive,
	buildCalendarHeatmapData,
	type DataPointDate,
	type GeoChartError,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
} from '@jetpack-premium-analytics/externals';

/**
 * UI passthrough
 *
 * Widgets must import these from here, never from
 * `@jetpack-premium-analytics/ui` directly: the toolkit is a shared script
 * module, so the ui package is bundled once instead of once per widget.
 */
export { safeHttpUrl } from '@jetpack-premium-analytics/ui';
