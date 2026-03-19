// =============================================================================
// CHARTS, COMPONENTS & PROVIDER (with namespaced types and utilities)
// =============================================================================
// Usage:
//   import { BarChart, Legend, GlobalChartsProvider } from '@automattic/charts';
//   import type { BarChart, Legend } from '@automattic/charts';
//
//   <GlobalChartsProvider>
//     <BarChart data={data} />
//     <BarChart.Unresponsive data={data} width={400} height={300} />
//   </GlobalChartsProvider>
//
//   const props: BarChart.Props = { data };
//   const item: Legend.Item = { ... };
// =============================================================================

// Charts
export {
	BarChart,
	BarListChart,
	ConversionFunnelChart,
	GeoChart,
	LeaderboardChart,
	LineChart,
	PieChart,
	PieSemiCircleChart,
	Sparkline,
} from './namespaces';

// Components
export { Legend, Tooltip, TrendIndicator } from './namespaces';

// Provider
export { GlobalChartsProvider } from './namespaces';

// =============================================================================
// TYPES
// =============================================================================
// Base types and shared interfaces
export type * from './types';
export type * from './visx/types';

// External library types
export type { LineStyles, GridStyles, EventHandlerParams } from '@visx/xychart';
export type {
	GoogleDataTableColumn,
	GoogleDataTableRow,
	GoogleDataTableColumnRoleType,
} from 'react-google-charts';
