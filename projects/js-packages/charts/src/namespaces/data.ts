/**
 * Data namespace - data types and structures used across charts.
 *
 * @example
 * ```tsx
 * import { Data } from '@automattic/charts';
 *
 * const point: Data.Point = { label: 'A', value: 100 };
 * const series: Data.Series = { label: 'Sales', data: [...] };
 * ```
 */

import type {
	DataPoint,
	DataPointDate,
	DataPointPercentage,
	SeriesData,
	SeriesDataOptions,
	LeaderboardEntry,
	GeoData,
	GradientStop,
	BaseChartProps,
	ChartLegendConfig,
	LegendPosition,
	LegendItemStyles,
	LegendLabelStyles,
	LegendShapeStyles,
	ScaleOptions,
	OrientationType,
	GridProps,
} from '../types';

// Data is a namespace-only export (types only)
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Data {
	// Data point types
	export type Point = DataPoint;
	export type PointDate = DataPointDate;
	export type PointPercentage = DataPointPercentage;

	// Series types
	export type Series = SeriesData;
	export type SeriesOptions = SeriesDataOptions;

	// Specialized data types
	export type Leaderboard = LeaderboardEntry;
	export type Geo = GeoData;

	// Gradient types
	export type Gradient = GradientStop;

	// Base chart props (generic)
	export type BaseChartPropsType< T = Point | PointDate | Leaderboard > = BaseChartProps< T >;

	// Legend config types
	export type LegendConfig< T = Point | PointDate | Leaderboard > = ChartLegendConfig< T >;
	export type LegendPositionType = LegendPosition;
	export type LegendItemStylesType = LegendItemStyles;
	export type LegendLabelStylesType = LegendLabelStyles;
	export type LegendShapeStylesType = LegendShapeStyles;

	// Scale and axis types
	export type Scale = ScaleOptions;
	export type Orientation = OrientationType;
	export type Grid = GridProps;
}

// For runtime, export an empty object so `import { Data }` works
export const Data = {} as typeof Data;
