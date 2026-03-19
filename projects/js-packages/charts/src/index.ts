/**
 * `@automattic/charts` - Chart components with namespaced types.
 *
 * @example
 * ```tsx
 * import { LineChart, BarChart, Legend } from '@automattic/charts';
 *
 * // Types are namespaced under each export
 * const props: LineChart.Props = { data: [...] };
 * const legendConfig: Legend.Props = { items: [...] };
 *
 * <LineChart data={data} />
 * ```
 */

// ============================================================================
// Chart Exports
// ============================================================================

export {
	BarChart,
	BarChartUnresponsive,
	BarList,
	BarListUnresponsive,
	ConversionFunnel,
	ConversionFunnelUnresponsive,
	Geo,
	GeoUnresponsive,
	Leaderboard,
	LeaderboardUnresponsive,
	LineChart,
	LineChartUnresponsive,
	PieChart,
	PieChartUnresponsive,
	PieSemiCircle,
	PieSemiCircleUnresponsive,
	Sparkline,
	SparklineUnresponsive,
} from './namespaces/charts';

// ============================================================================
// Component Exports
// ============================================================================

export { Legend, Tooltip, TrendIndicator } from './namespaces/components';

// ============================================================================
// Provider Exports
// ============================================================================

export { GlobalChartsProvider, ThemeProvider } from './namespaces/providers';

// ============================================================================
// Hooks Export
// ============================================================================

export { Hooks } from './namespaces/hooks';

// ============================================================================
// Data Types Export
// ============================================================================

export { Data } from './namespaces/data';

// ============================================================================
// Theme Types Export
// ============================================================================

export { Theme } from './namespaces/theme';
