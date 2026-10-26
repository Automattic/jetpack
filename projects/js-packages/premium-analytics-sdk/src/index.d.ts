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
	title?: string;
	description: string;
	actions?: Array< { label: string; onClick: () => void } >;
};
type WidgetStateEmpty = {
	// The host's icon prop, loose until the contract types icons.
	icon?: any;
	description?: string;
	action?:
		| { label: string; href: string; openInNewTab?: boolean; onClick?: never }
		| { label: string; onClick: () => void };
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

// Report actions: the "View all" link and the report's CSV download, declared to the dashboard, which
// renders them in the card footer. Returns whether the host places them.
export declare function useReportActions( options: ReportActionsOptions ): boolean;
export type ReportActionsOptions = {
	// Action id of the link; a second call with another id adds a link beside "View all".
	id?: string;
	// Report id the link opens, as `/reports/<report>`; none for no link.
	report?: string;
	// Report tab the link opens (`?section=`).
	section?: string;
	// Link label; "View all" by default.
	label?: string;
	// Where the dashboard places the link; `high` (the footer's text action) by default.
	relevance?: 'high' | 'medium' | 'low';
	// The linked report's CSV download, offered once the rows settle; none for no download.
	csv?: {
		// The report's exporter, or the id of a report the dashboard exports.
		exporter?: any;
		report?: string;
		status: { isLoading: boolean; isFetching: boolean; isError: boolean };
		rowCount: number;
	};
};

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

// Breakdowns: segments in, with their states, total, legend and deltas handled. Drawn as a ring, or as
// a half ring with `variant: 'half-ring'`; there is no separate semi-circle kind.
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
	// `ring` is the full donut with the total in its center, `half-ring` the semi-circle with the total
	// under the arc. Defaults to `ring`.
	variant?: 'ring' | 'half-ring';
	// Whether the total of the segments shows; off for shares that add up to one. Defaults to on.
	withTotal?: boolean;
	// What the chart shows, such as the widget title; the chart is named "Chart: <title>".
	chartTitle?: string;
	// The total the report states, for segments that need not add up to it. Omit to sum them.
	total?: number;
	previousTotal?: number;
};

// Funnels: steps as counts in, with the rate of the whole, the shares and the states handled.
export declare const Funnel: ComponentType< FunnelProps >;
export type FunnelStepInput = {
	// Stable key of the step; the chart anchors its selection on it.
	id: string;
	label: string;
	// Count for the selected period.
	value: number;
	// Count for the comparison period; undefined when the step has no match there.
	previousValue?: number;
};
export type FunnelProps = {
	// The steps in order: the first is the whole the others are shares of, and the rate of the whole is
	// the last step over the first.
	steps: readonly FunnelStepInput[];
	status: WidgetStatus;
	// Omit for the generic message with a Retry bound to `status.refetch`.
	error?: WidgetStateError;
	// Omit for the generic "no results for this time period" state.
	empty?: WidgetStateEmpty;
	// Format of the step counts, in the tooltip. Defaults to compact integers.
	format?: DataFormat;
	// What the chart shows, such as the widget title; the chart is named "Chart: <title>".
	chartTitle?: string;
};

// Columns: a few categories compared across the periods as vertical bars, with the series per
// period, the legend and the states handled.
export declare const Columns: ComponentType< ColumnsProps >;
export type ColumnInput = {
	// Unique within the chart: the x-axis category.
	label: string;
	// Figure for the selected period.
	value: number;
	// Figure for the comparison period; undefined draws as 0 there, and null, no figure, draws no bar.
	previousValue?: number | null;
};
export type ColumnsProps = {
	// The columns in order; each one draws once per period.
	columns: readonly ColumnInput[];
	status: WidgetStatus;
	// Omit for the generic message with a Retry bound to `status.refetch`.
	error?: WidgetStateError;
	// Omit for the generic "no results for this time period" state.
	empty?: WidgetStateEmpty;
	// Format of the figures, on the y axis and in the tooltip. Defaults to compact integers.
	format?: DataFormat;
	// What the chart shows, such as the widget title; the chart is named "Chart: <title>".
	chartTitle?: string;
};

// Locations: a ranking of places in, the list with flags beside the map that draws them, the
// shares, deltas and states handled.
export declare const Locations: ComponentType< LocationsProps >;
export type LocationRowInput = {
	// ISO country code on the world map; the region's name inside a country.
	id: string;
	label: string;
	// Figure for the selected period.
	value: number;
	// Figure for the comparison period; undefined when the location has no match there.
	previousValue?: number;
};
export type LocationsProps = {
	// The ranking in order: countries, or the regions of `country`. The map draws them all, the
	// list the first `maxRows`.
	rows: readonly LocationRowInput[];
	status: WidgetStatus;
	// Omit for the generic message with a Retry bound to `status.refetch`.
	error?: WidgetStateError;
	// Omit for the generic "no results for this time period" state.
	empty?: WidgetStateEmpty;
	// Defaults to compact integers.
	format?: DataFormat;
	// What the figure is, as the map tooltip names it.
	valueLabel: string;
	// The country the rows are regions of; omit for countries on the world map.
	country?: { code: string; name: string };
	// Rows the list shows. Defaults to the widget row limit.
	maxRows?: number;
	// What the widget shows, such as its title; the list is named "Chart: <title>" and the map "Map: <title>".
	chartTitle?: string;
};

// Widget attributes. The chart type is not one: a widget declares it as a `jpa/toggle-group` field.
export declare function reportParamsAttributeField< Attributes = any >( options?: any ): any;
export declare function defaultReportParamsForGrain( ...args: any[] ): any;
export type ReportParamsFieldAttributes = any;
export type ReportGrain = any;

// The link to a single-report page, `/report/{kind}/{id}`, keeping the shared report window.
export declare function buildSingleReportLink(
	kind: string,
	id: string | number,
	search: Record< string, unknown > | undefined
): string;

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
	// Where each period starts while a comparison is on, for `buildMetricTab`'s `periodStarts`.
	// Absent on dashboards older than it.
	periodStarts?: { current: string; comparison: string };
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
	// Defaults to true. False for a query whose failure leaves the figures on screen current, such as product details.
	refreshNotice?: boolean;
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

// UI primitives the widgets share with the dashboard, so no widget bundles its own copy. They go
// the day `@wordpress/ui` ships as a script module and wp-build externalizes it on its own.
export declare const Badge: AnyComponent;
export declare const Button: AnyComponent;
export declare const ButtonLink: AnyComponent;
export declare const Progress: {
	Root: AnyComponent;
	Track: AnyComponent;
	Indicator: AnyComponent;
	Label: AnyComponent;
	Value: AnyComponent;
};
export declare const Stack: AnyComponent;
export declare const Text: AnyComponent;
export declare const VisuallyHidden: AnyComponent;
