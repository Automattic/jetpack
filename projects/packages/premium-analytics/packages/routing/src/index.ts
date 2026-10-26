export {
	decodeDateSearchParam,
	encodeDateToSearchParam,
	encodeRangeToSearchParams,
} from './search/date-range';

export { deriveComparisonRange } from './search/comparison';
export { buildRangePatch } from './hooks/use-report-date-filters/build-range-patch';
export {
	REPORT_DATE_PARAM_KEYS,
	omitComparisonReportParams,
	omitReportDateParams,
	pickReportDateParams,
	pickReportNavigationParams,
	pickReportOriginWindowParams,
	toReportOriginWindowParams,
	hasPrimaryDateDraft,
	buildDashboardLink,
	buildReportLink,
	buildSingleReportLink,
} from './search/report-params';
export { DASHBOARD_ORIGIN_PARAM, pickDashboardOriginParams } from './search/dashboard-origin';
export { DASHBOARD_PAGE_SLUG, buildDashboardHref } from './dashboard-href';
export { DashboardWidgetHostProvider } from './widget-host';
export {
	REPORT_ORIGIN_PARAM_KEYS,
	createReportOriginSearch,
	createDetailLinkSearch,
	readReportOriginSearch,
	pickReportOriginParams,
	type DetailLinkSearchUpdater,
	type ReportOrigin,
} from './search/report-origin';
export {
	useStagedSearch,
	useStagedValue,
	useReportDateFilters,
	useSectionTab,
	useDashboardLink,
	useOpenSectionRange,
	usePeriodHost,
	type OpenSectionRange,
	type ReportDateFilters,
} from './hooks';
export {
	defineReportTabs,
	type ReportTab,
	type ReportTabDefinition,
	type ReportTabs,
} from './tabs';
