export { AnalyticsQueryClientProvider, queryClient } from './providers/query-client-provider';
export {
	ReportScopeProvider,
	useReportScope,
	useScopeLockedIntervals,
	type DateLimits,
	type DateLimitUpsellCopy,
	type ReportScope,
} from './providers/report-scope';
export {
	PERIOD_CHANGE_ATTENTION_MS,
	PeriodChangeSignalProvider,
	postSurface,
	useRaisePeriodChange,
	useSettlePeriodChange,
} from './providers/period-change-signal';
export * from './hooks';
export { ensureDashboardEntities } from './entities/dashboard-entities';
export { latestPostQuery, postContentQuery, postsContentQuery } from './queries/latest-post-query';
export type { LatestPost, LatestPostResponse } from './processing/latest-post';
export { authorPostsQuery } from './queries/author-posts-query';
export type { AuthorPostsRecord } from './processing/author';
export { statsInsightsQuery } from './queries/stats-insights-query';
export {
	fetchStatsArchivesRows,
	fetchStatsClicksRows,
	fetchStatsComments,
	fetchStatsEmailSummaryRows,
	fetchStatsFileDownloadsRows,
	fetchStatsInsightsYears,
	fetchStatsLocationsRows,
	fetchStatsReferrersRows,
	fetchStatsSearchTermsReport,
	fetchStatsTagsRows,
	fetchStatsTopAuthorsRows,
	fetchStatsTopPostsRows,
	fetchStatsUtmRows,
	fetchStatsVideoPlaysRows,
} from './queries/fetch-stats-report-rows';
export { type StatsLocationsParams } from './queries/stats-locations-query';
export { type StatsVideoPlaysSummaryParams } from './queries/stats-video-plays-summary-query';
export {
	aggregateStatsDrilldownRows,
	bucketStatsTimeSeries,
	flattenStatsLeaves,
	getStatsChartBucketKey,
	getStatsReportItems,
	selectStatsCommentsRows,
	STATS_CHART_BUCKET_PERIODS,
} from './processing/stats';
export type { FlattenStatsLeavesContext, FlattenStatsLeavesOptions } from './processing/stats';
export type {
	AggregateStatsDrilldownRowsOptions,
	StatsDrilldownItemContext,
	StatsDrilldownRow,
	StatsDrilldownRowContext,
	StatsDrilldownSourceReport,
} from './processing/stats';
export type { StatsEmailSummaryItem } from './processing/stats';
export type { StatsDeviceProperty } from './queries/stats-devices-query';
export {
	normalizeReportParams,
	needsReportDateParamsSeed,
	hasComparisonEnabled,
	type PresetType,
	type ReportParams,
	type ReportPresetId,
} from './utils/search';
export {
	ensureCoreSettingsReady,
	isSelectablePreset,
	computeDateRangeFromPreset,
	getApiErrorCode,
	getApiErrorStatus,
	findAuthorRow,
	isAccessDenied,
	isUserRetryableError,
	saveBlob,
	shouldRetryApiError,
	StatsResponseShapeError,
	toAuthorId,
	toPostId,
	useSiteHomeUrl,
	withoutComparison,
} from './utils';
export {
	getAllowedIntervalsForPreset,
	getDaysBetweenInclusive,
	getDefaultIntervalForPeriod,
	resolveIntervalForPresetChange,
	resolveIntervalForRange,
} from './utils/interval';
export type { IntervalType, LockableInterval } from './utils/interval';
export {
	chartInterval,
	defaultPeriodForInterval,
	drawableIntervals,
	intervalMenuOptions,
	type IntervalExtension,
	type IntervalRange,
} from './utils/periods';
export {
	isDashboardSectionAvailable,
	isPostDetailAvailable,
	POST_DETAIL_SECTION,
	type DashboardSectionSlug,
} from './utils/dashboard-sections';
export {
	getLockedFeature,
	getLockedSection,
	getLockedWidgetFeature,
	isStatsFeatureLocked,
	type LockedSectionGate,
	type StatsFeatureKey,
} from './utils/plan-gates';
export { getStatsCheckoutUrl } from './utils/stats-checkout-url';
export {
	applyStatsDatePolicy,
	getPolicyDefaultPreset,
	getSectionDatePolicy,
	getStatsDatePolicy,
	isDateLimitedPolicy,
	isPlanDateLimitedSection,
	isPresetLockedByPolicy,
	OPEN_DATE_POLICY,
	type DateLimitFeature,
	type StatsDatePolicy,
} from './utils/stats-date-policy';
export {
	DASHBOARD_PREFERENCES_SCOPE,
	getDefaultPreset,
	getDefaultQueryParams,
	getDefaultReportParams,
	rememberComparison,
	rememberPreset,
	withDefaultComparison,
} from './defaults';
export { downloadReport, fetchStatsProxy } from './api';
export { disableDashboard } from './api';
export { submitStatsUserFeedback, type StatsFeedbackRating, type StatsUserFeedback } from './api';
export type {
	DownloadReportParams,
	DownloadReportResponse,
	StatsProxyFetchParams,
	StatsProxyMethod,
	StatsProxyParams,
	StatsProxyVersion,
} from './api';
export type {
	StatsArchivesComparisonItem,
	StatsArchivesItem,
	StatsChartBucketPeriod,
	StatsClicksComparisonItem,
	StatsClicksItem,
	StatsCommentFollowersItem,
	StatsCommentFollowersRawPost,
	StatsCommentFollowersRawResponse,
	StatsCommentsAuthorItem,
	StatsCommentsGroup,
	StatsCommentsGroupItem,
	StatsCommentsItem,
	StatsCommentsPostItem,
	StatsCommentsRawAuthor,
	StatsCommentsRawFollowData,
	StatsCommentsRawPost,
	StatsCommentsRawResponse,
	StatsCommentsRow,
	StatsEmailBreakdownItem,
	StatsDevicesComparisonItem,
	StatsDevicesItem,
	StatsFileDownloadsComparisonItem,
	StatsFileDownloadsItem,
	StatsFollowersItem,
	StatsFollowersRawItem,
	StatsFollowersRawResponse,
	StatsItemAction,
	StatsLocationCoordinates,
	StatsLocationsComparisonItem,
	StatsLocationsItem,
	StatsNormalizedDataPoint,
	StatsNormalizedItem,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsNormalizedSummary,
	StatsPostDay,
	StatsPostMeta,
	StatsPostMonthValues,
	StatsPostRawResponse,
	StatsPostWeek,
	StatsPostWeekDay,
	StatsPostYear,
	StatsReferrersComparisonItem,
	StatsReferrersItem,
	StatsSearchTermsComparisonItem,
	StatsSearchTermsItem,
	StatsSubscribersCountsRawResponse,
	StatsSubscribersDataPoint,
	StatsSubscribersRawResponse,
	StatsStreakRawResponse,
	StatsTagsChildItem,
	StatsTagsItem,
	StatsTagsLabel,
	StatsTagsRawItem,
	StatsTagsRawResponse,
	StatsTagsRawTag,
	StatsTimeSeriesDataPoint,
	StatsTimeSeriesReport,
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsItem,
	StatsTopAuthorsPostComparisonItem,
	StatsTopPostsComparisonItem,
	StatsTopPostsItem,
	StatsUtmComparisonItem,
	StatsUtmComparisonTopPostItem,
	StatsUtmItem,
	StatsUtmParam,
	StatsUtmTopPostItem,
	StatsVideoPlaysComparisonItem,
	StatsVideoPlaysItem,
} from './processing/stats';
export { compareEmailBreakdownItems } from './processing/stats';
export type { StatsReportParams } from './queries/stats-query';
export {
	getStatsPeriodFromInterval,
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
	type StatsPeriod,
	type StatsQueryParams,
} from './utils/stats-params';
export {
	mergeStatsArchivesComparisonRows,
	mergeStatsClicksComparisonRows,
	mergeStatsReferrersComparisonRows,
	mergeStatsComparisonRows,
	mergeStatsDevicesComparisonRows,
	mergeStatsFileDownloadsComparisonRows,
	mergeStatsLocationsComparisonRows,
	mergeStatsSearchTermsComparisonRows,
	mergeStatsTopAuthorsComparisonRows,
	mergeStatsTopPostsComparisonRows,
	mergeStatsUtmComparisonRows,
	mergeStatsVideoPlaysComparisonRows,
} from './processing/stats';
export type { StatsComparisonRowContext } from './processing/stats';
