/**
 * The SDK the Premium Analytics dashboard provides to plugins that extend it: today, everything a
 * widget imports. The dashboard registers the implementation at runtime as the
 * `@automattic/jetpack-premium-analytics-sdk` script module; a consumer's build leaves imports of
 * this package external.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- PoC: the contract gets precise types before the package is published. */
import type { ComponentType } from 'react';

type AnyComponent = ComponentType< any >;

// Widget shell.
export declare const WidgetRoot: AnyComponent;
export declare function useWidgetRootContext(): any;
export declare const WidgetState: AnyComponent;
export declare function describeError( ...args: any[] ): any;

// The states a widget kind takes from its widget. Not exported: no consumer names them, a kind's
// props carry them.
type WidgetStateError = {
	description: string;
	actions?: Array< { label: string; onClick: () => void } >;
};
type WidgetStateEmpty = {
	// The host's icon prop, loose until the contract types icons.
	icon?: any;
	description?: string;
};

// What a widget kind knows about its request, in the data layer's terms. Every kind takes it.
export type WidgetStatus = {
	// Nothing on screen answers the current params.
	isLoading: boolean;
	// Unchanged params being revalidated.
	isFetching?: boolean;
	isError?: boolean;
	// The comparison period is on and the data carries values for it.
	hasComparison?: boolean;
	// Re-runs the request; the default error state offers it as Retry.
	refetch?: () => unknown;
};

// Footer chrome, until widgets declare their footer as actions the host renders.
export declare const WidgetFooter: AnyComponent;
export declare const ReportLink: AnyComponent;
export declare const ExporterCsvDownloadButton: AnyComponent;

// Charts and metrics: parts of the metric tabs and metric tiles kinds, until those kinds exist.
export declare const ChartEmptyState: AnyComponent;
export declare const MetricTabsChart: AnyComponent;
export declare const MetricTabsChartSkeleton: AnyComponent;
export declare const MetricTileGrid: AnyComponent;
export declare const MetricTileGridSkeleton: AnyComponent;
export declare function buildMetricTab( ...args: any[] ): any;
export type DataFormat = any;
export type CountLabel = any;
export type ChartDisplayChartType = any;

// Leaderboards: ranked rows in, with their states, comparison and drill-down handled.
export declare const Leaderboard: AnyComponent;
export type LeaderboardProps = any;
export type LeaderboardRowInput = any;
export type LeaderboardStatus = WidgetStatus;
export type LeaderboardDrillDown = any;

// Breakdowns: segments in, with their states, total, legend and deltas handled.
export declare const Donut: ComponentType< DonutProps >;
export type DonutSegmentInput = {
	// Unique within the breakdown: the chart identifies a segment by its label.
	label: string;
	value: number;
	// Undefined when the segment has no match in the comparison period.
	previousValue?: number;
	// Drawn in the neutral tone instead of a palette color, e.g. a cancelled status.
	muted?: boolean;
};
export type DonutProps = {
	// The whole breakdown: a segment with no value draws no slice but keeps its legend row and its
	// comparison value.
	segments: readonly DonutSegmentInput[];
	status: WidgetStatus;
	// Omit for the generic message with a Retry bound to `status.refetch`.
	error?: WidgetStateError;
	// Omit for the generic "no results for this time period" state.
	empty?: WidgetStateEmpty;
	// Defaults to compact integers.
	format?: DataFormat;
};

// Widget attributes. The chart type is not one: a widget declares it as a `jpa/toggle-group` field.
export declare function reportParamsAttributeField< Attributes = any >( options?: any ): any;
export declare function defaultReportParamsForGrain( ...args: any[] ): any;
export type ReportParamsFieldAttributes = any;
export type ReportGrain = any;

// Report scope and dates.
export type ReportParams = any;
export type StatsPeriod = any;
export declare const ReportScopeProvider: AnyComponent;
export declare function chartInterval( ...args: any[] ): any;
export declare const PRESET_LAST_7_DAYS: string;
export declare const PRESET_LAST_30_DAYS: string;
export declare const PRESET_LAST_12_MONTHS: string;

// Report queries. Runs a query and its comparison in the dashboard's query client, so a product
// package builds its own report hooks on it and does not publish them here.
export type ReportQueryType = 'primary' | 'comparison';

// What a query factory returns: the options the dashboard reads before it runs the query.
export type ReportQuery< TData > = {
	queryKey: readonly unknown[];
	queryFn?: () => Promise< TData >;
	enabled?: boolean;
	placeholderData?: ( previousData: TData | undefined ) => TData | undefined;
};

// One period's query, as the dashboard's query client reports it.
export type ReportQueryResult< TData > = {
	data: TData | undefined;
	error: unknown;
	isError: boolean;
	isSuccess: boolean;
	isPending: boolean;
	isLoading: boolean;
	isFetching: boolean;
	isFetched: boolean;
	isPlaceholderData: boolean;
	refetch: () => Promise< unknown >;
};

export type ReportResult< TData > = {
	primary: ReportQueryResult< TData >;
	comparison: ReportQueryResult< TData >;
	hasComparison: boolean;
	// The zone both periods were built under.
	timezone: string;
	// True while nothing on screen answers the current params; see WidgetState.
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => Promise< void >;
};

export type UseReportOptions = {
	enabled?: boolean;
	// Where the comparison query parks while the params carry no comparison.
	disabledComparisonKey?: string[];
};

export declare function useReport< TData, TParams extends ReportParams = ReportParams >(
	queryFactory: ( params: TParams, queryType: ReportQueryType ) => ReportQuery< TData >,
	params: TParams,
	options?: UseReportOptions
): ReportResult< TData >;

// Bucket bounds. Writes the start or end of a report row as the dashboard's time series read it:
// the wall time in the report's zone, with no offset.
export declare function toBucketStamp( raw: string | undefined, zone: string ): string;

// Data. The WordAds hooks are provisional: they stay until the Ads package reads its endpoints
// with a client of its own.
export declare function useStatsWordAdsStats( ...args: any[] ): any;
export declare function useStatsWordAdsEarnings( ...args: any[] ): any;
export type StatsWordAdsResponse = any;
export type StatsWordAdsEarningsResponse = any;

// The video plays hook is provisional the same way: shared with the dashboard's Videos report until
// that report moves to the VideoPress package.
export declare function useStatsVideoPlays( ...args: any[] ): any;
export declare function getVideoPosterUrl(
	poster: unknown,
	width: number,
	height: number
): string | undefined;
export type StatsVideoPlaysComparisonItem = any;

// Ads earnings history, provisional too: shared with the dashboard's Earnings report until that report
// moves to the Ads package.
export declare const EarningsHistoryList: AnyComponent;
export declare function flattenEarningsBreakdown( ...args: any[] ): any;

// UI primitives the widgets share with the dashboard, so no widget bundles its own copy.
export declare const Badge: AnyComponent;
export declare const Stack: AnyComponent;
