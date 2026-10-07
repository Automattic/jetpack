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
export type LeaderboardStatus = any;
export type LeaderboardDrillDown = any;

// Widget attributes.
export declare function reportParamsAttributeField< Attributes = any >( options?: any ): any;
export declare function chartTypeAttributeField< Attributes = any >( options?: any ): any;
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
export declare function useReport( ...args: any[] ): any;

// Bucket bounds. Writes the start or end of a report row as the dashboard's time series read it:
// the wall time in the report's zone, with no offset.
export declare function toBucketStamp( raw: string | undefined, zone: string ): string;

// Data. The WordAds hooks are provisional: they move to the Ads package once the SDK exposes the
// generic report hooks they are built on.
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
