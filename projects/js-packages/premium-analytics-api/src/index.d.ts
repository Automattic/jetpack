/**
 * The API the Premium Analytics dashboard provides to plugins that build widgets for it. The
 * dashboard registers the implementation at runtime as the `@automattic/jetpack-premium-analytics-api`
 * script module; a consumer's build leaves imports of this package external.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- PoC: the contract gets precise types before the package is published. */
import type { ComponentType } from 'react';

type AnyComponent = ComponentType< any >;

// Widget shell.
export declare const WidgetRoot: AnyComponent;
export declare function useWidgetRootContext(): any;
export declare const WidgetState: AnyComponent;
export declare const WidgetFooter: AnyComponent;
export declare const ReportLink: AnyComponent;

// Charts and metrics.
export declare const MetricTabsChart: AnyComponent;
export declare const MetricTabsChartSkeleton: AnyComponent;
export declare const MetricTileGrid: AnyComponent;
export declare const MetricTileGridSkeleton: AnyComponent;
export declare function buildMetricTab( ...args: any[] ): any;
export type DataFormat = any;
export type CountLabel = any;
export type ChartDisplayChartType = any;

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

// Data.
export declare function useStatsWordAdsStats( ...args: any[] ): any;
export declare function useStatsWordAdsEarnings( ...args: any[] ): any;
export type StatsWordAdsResponse = any;
export type StatsWordAdsEarningsResponse = any;

// Ads earnings history, shared with the dashboard's Earnings report until that report moves out.
export declare const EarningsHistoryList: AnyComponent;
export declare function flattenEarningsBreakdown( ...args: any[] ): any;

// UI primitives the widgets share with the dashboard, so no widget bundles its own copy.
export declare const Badge: AnyComponent;
export declare const Stack: AnyComponent;
