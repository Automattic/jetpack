// Charts
export { BarChart, BarChartUnresponsive } from './charts/bar-chart';
export { BarListChart, BarListChartUnresponsive } from './charts/bar-list-chart';
export { ConversionFunnelChart } from './charts/conversion-funnel-chart';
export { GeoChart, GeoChartUnresponsive } from './charts/geo-chart';
export { LeaderboardChart, LeaderboardChartUnresponsive } from './charts/leaderboard-chart';
export { LineChart, LineChartUnresponsive } from './charts/line-chart';
export { PieChart, PieChartUnresponsive } from './charts/pie-chart';
export { PieSemiCircleChart, PieSemiCircleChartUnresponsive } from './charts/pie-semi-circle-chart';
export { Sparkline, SparklineUnresponsive } from './charts/sparkline';

// Components
export { BaseTooltip } from './components/tooltip';
export { Legend, useChartLegendItems } from './components/legend';
export { TrendIndicator } from './components/trend-indicator';

// Compositions

// Themes
export { GlobalChartsProvider as ThemeProvider } from './providers';

// Global context
export {
	GlobalChartsProvider,
	useGlobalChartsContext,
	useGlobalChartsTheme,
	GlobalChartsContext,
	defaultTheme,
} from './providers';

// Types
export type * from './types';
export type * from './visx/types';
export type { PieChartProps, PieChartRenderTooltipParams } from './charts/pie-chart';
export type {
	PieSemiCircleChartProps,
	PieSemiCircleChartRenderTooltipParams,
} from './charts/pie-semi-circle-chart';
export type { GeoChartProps, GeoRegion, GeoResolution } from './charts/geo-chart';
export type { LegendValueDisplay, BaseLegendItem } from './components/legend';
export type { TrendIndicatorProps, TrendDirection } from './components/trend-indicator';
export type { LineStyles, GridStyles, EventHandlerParams } from '@visx/xychart';
export type {
	GoogleDataTableColumn,
	GoogleDataTableRow,
	GoogleDataTableColumnRoleType,
} from 'react-google-charts';

// Re-exports from removed individual entry points
export { useLeaderboardLegendItems } from './charts/leaderboard-chart/hooks';

// Previously available via '@automattic/charts/tooltip', '@automattic/charts/legend'
export { AccessibleTooltip, useKeyboardNavigation } from './components/tooltip';
export type { BaseTooltipProps, TooltipData, TooltipProps } from './components/tooltip';
export type { LegendProps, BaseLegendProps, ChartLegendOptions } from './components/legend';

// Previously available via '@automattic/charts/bar-chart', '@automattic/charts/line-chart', etc.
export type { BarChartProps } from './charts/bar-chart';
export type {
	BarListChartProps,
	RenderLabelProps,
	RenderValueProps,
} from './charts/bar-list-chart';
export type {
	ConversionFunnelChartProps,
	FunnelStep,
	StepLabelRenderProps,
	StepRateRenderProps,
	MainMetricRenderProps,
	TooltipRenderProps,
} from './charts/conversion-funnel-chart';
export type { LeaderboardChartProps } from './charts/leaderboard-chart';
export type {
	LineChartProps,
	LineChartAnnotationProps,
	RenderLineGlyphProps,
	TooltipDatum,
	CurveType,
} from './charts/line-chart';
export type { ArcData } from './charts/pie-semi-circle-chart';
export type { SparklineProps, GradientConfig, SparklineDataPoint } from './charts/sparkline';

// Previously available via '@automattic/charts/hooks'
export {
	useDeepMemo,
	useChartMouseHandler,
	useXYChartTheme,
	useChartDataTransform,
	useChartMargin,
	useElementSize,
	useTextTruncation,
	useZeroValueDisplay,
	useInteractiveLegendData,
	usePrefersReducedMotion,
	useTooltipPortalRelocator,
} from './hooks';

// Previously available via '@automattic/charts/utils'
export {
	attachSubComponents,
	parseAsLocalDate,
	formatMetricValue,
	formatPercentage,
	getLongestTickWidth,
	getSeriesLineStyles,
	getSeriesStroke,
	getItemShapeStyles,
	isSafari,
	mergeThemes,
	resolveCssVariable,
} from './utils';
export * from './utils/color-utils';
export type { MetricValueType } from './utils';
