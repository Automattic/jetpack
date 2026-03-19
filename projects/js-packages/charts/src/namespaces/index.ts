/**
 * Chart and component namespaces for improved discoverability
 *
 * @example
 * ```tsx
 * import { LineChart, BarChart, Legend, Tooltip } from '@automattic/charts';
 * import type { LineChart, BarChart, Legend } from '@automattic/charts';
 *
 * <LineChart data={lineData} />
 * <BarChart.Unresponsive data={barData} width={400} height={300} />
 * <Legend items={items} />
 *
 * const props: BarChart.Props = { data };
 * const legendItem: Legend.Item = { ... };
 * ```
 */

// Charts
export { BarChart } from './bar-chart';
export { BarListChart } from './bar-list-chart';
export { ConversionFunnelChart } from './conversion-funnel-chart';
export { GeoChart } from './geo-chart';
export { LeaderboardChart } from './leaderboard-chart';
export { LineChart } from './line-chart';
export { PieChart } from './pie-chart';
export { PieSemiCircleChart } from './pie-semi-circle-chart';
export { Sparkline } from './sparkline';

// Components
export { Legend } from './legend';
export { Tooltip } from './tooltip';
export { TrendIndicator } from './trend-indicator';

// Provider
export { GlobalChartsProvider } from './provider';
