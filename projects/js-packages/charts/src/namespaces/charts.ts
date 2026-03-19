/**
 * Chart exports with namespaced types.
 *
 * Each chart export includes its component and related types under a single namespace.
 */

import {
	BarChart as BarChartComponent,
	BarChartUnresponsive as BarChartUnresponsiveComponent,
} from '../charts/bar-chart';
import {
	BarListChart as BarListComponent,
	BarListChartUnresponsive as BarListUnresponsiveComponent,
} from '../charts/bar-list-chart';
import { ConversionFunnelChart as ConversionFunnelComponent } from '../charts/conversion-funnel-chart';
import {
	GeoChart as GeoComponent,
	GeoChartUnresponsive as GeoUnresponsiveComponent,
} from '../charts/geo-chart';
import {
	LeaderboardChart as LeaderboardComponent,
	LeaderboardChartUnresponsive as LeaderboardUnresponsiveComponent,
} from '../charts/leaderboard-chart';
import {
	LineChart as LineChartComponent,
	LineChartUnresponsive as LineChartUnresponsiveComponent,
} from '../charts/line-chart';
import {
	PieChart as PieChartComponent,
	PieChartUnresponsive as PieChartUnresponsiveComponent,
} from '../charts/pie-chart';
import {
	PieSemiCircleChart as PieSemiCircleComponent,
	PieSemiCircleChartUnresponsive as PieSemiCircleUnresponsiveComponent,
} from '../charts/pie-semi-circle-chart';
import {
	Sparkline as SparklineComponent,
	SparklineUnresponsive as SparklineUnresponsiveComponent,
} from '../charts/sparkline';
import type { BarChartProps } from '../charts/bar-chart';
import type {
	BarListChartProps,
	RenderLabelProps as BarListRenderLabelProps,
	RenderValueProps as BarListRenderValueProps,
} from '../charts/bar-list-chart';
import type {
	ConversionFunnelChartProps,
	FunnelStep,
	StepLabelRenderProps,
	StepRateRenderProps,
	MainMetricRenderProps,
	TooltipRenderProps as ConversionFunnelTooltipRenderProps,
} from '../charts/conversion-funnel-chart';
import type { GeoChartProps, GeoRegion, GeoResolution } from '../charts/geo-chart';
import type { LeaderboardChartProps } from '../charts/leaderboard-chart';
import type {
	LineChartProps,
	LineChartAnnotationProps,
	RenderLineGlyphProps,
	TooltipDatum,
	CurveType,
} from '../charts/line-chart';
import type { PieChartProps, PieChartRenderTooltipParams } from '../charts/pie-chart';
import type {
	PieSemiCircleChartProps,
	PieSemiCircleChartRenderTooltipParams,
	ArcData,
} from '../charts/pie-semi-circle-chart';
import type { SparklineProps, GradientConfig, SparklineDataPoint } from '../charts/sparkline';

// ============================================================================
// BarChart
// ============================================================================

export const BarChart = BarChartComponent;
export const BarChartUnresponsive = BarChartUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarChart {
	export type Props = BarChartProps;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarChartUnresponsive {
	export type Props = BarChartProps;
}

// ============================================================================
// BarList
// ============================================================================

export const BarList = BarListComponent;
export const BarListUnresponsive = BarListUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarList {
	export type Props = BarListChartProps;
	export type RenderLabelProps = BarListRenderLabelProps;
	export type RenderValueProps = BarListRenderValueProps;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarListUnresponsive {
	export type Props = BarListChartProps;
	export type RenderLabelProps = BarListRenderLabelProps;
	export type RenderValueProps = BarListRenderValueProps;
}

// ============================================================================
// ConversionFunnel
// ============================================================================

export const ConversionFunnel = ConversionFunnelComponent;
export const ConversionFunnelUnresponsive = ConversionFunnelComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConversionFunnel {
	export type Props = ConversionFunnelChartProps;
	export type Step = FunnelStep;
	export type StepLabelProps = StepLabelRenderProps;
	export type StepRateProps = StepRateRenderProps;
	export type MainMetricProps = MainMetricRenderProps;
	export type TooltipProps = ConversionFunnelTooltipRenderProps;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConversionFunnelUnresponsive {
	export type Props = ConversionFunnelChartProps;
	export type Step = FunnelStep;
	export type StepLabelProps = StepLabelRenderProps;
	export type StepRateProps = StepRateRenderProps;
	export type MainMetricProps = MainMetricRenderProps;
	export type TooltipProps = ConversionFunnelTooltipRenderProps;
}

// ============================================================================
// Geo
// ============================================================================

export const Geo = GeoComponent;
export const GeoUnresponsive = GeoUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Geo {
	export type Props = GeoChartProps;
	export type Region = GeoRegion;
	export type Resolution = GeoResolution;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GeoUnresponsive {
	export type Props = GeoChartProps;
	export type Region = GeoRegion;
	export type Resolution = GeoResolution;
}

// ============================================================================
// Leaderboard
// ============================================================================

export const Leaderboard = LeaderboardComponent;
export const LeaderboardUnresponsive = LeaderboardUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Leaderboard {
	export type Props = LeaderboardChartProps;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LeaderboardUnresponsive {
	export type Props = LeaderboardChartProps;
}

// ============================================================================
// LineChart
// ============================================================================

export const LineChart = LineChartComponent;
export const LineChartUnresponsive = LineChartUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LineChart {
	export type Props = LineChartProps;
	export type AnnotationProps = LineChartAnnotationProps;
	export type RenderGlyphProps< Datum extends object > = RenderLineGlyphProps< Datum >;
	export type TooltipData = TooltipDatum;
	export type Curve = CurveType;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LineChartUnresponsive {
	export type Props = LineChartProps;
	export type AnnotationProps = LineChartAnnotationProps;
	export type RenderGlyphProps< Datum extends object > = RenderLineGlyphProps< Datum >;
	export type TooltipData = TooltipDatum;
	export type Curve = CurveType;
}

// ============================================================================
// PieChart
// ============================================================================

export const PieChart = PieChartComponent;
export const PieChartUnresponsive = PieChartUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieChart {
	export type Props = PieChartProps;
	export type RenderTooltipParams = PieChartRenderTooltipParams;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieChartUnresponsive {
	export type Props = PieChartProps;
	export type RenderTooltipParams = PieChartRenderTooltipParams;
}

// ============================================================================
// PieSemiCircle
// ============================================================================

export const PieSemiCircle = PieSemiCircleComponent;
export const PieSemiCircleUnresponsive = PieSemiCircleUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieSemiCircle {
	export type Props = PieSemiCircleChartProps;
	export type RenderTooltipParams = PieSemiCircleChartRenderTooltipParams;
	export type Arc = ArcData;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieSemiCircleUnresponsive {
	export type Props = PieSemiCircleChartProps;
	export type RenderTooltipParams = PieSemiCircleChartRenderTooltipParams;
	export type Arc = ArcData;
}

// ============================================================================
// Sparkline
// ============================================================================

export const Sparkline = SparklineComponent;
export const SparklineUnresponsive = SparklineUnresponsiveComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Sparkline {
	export type Props = SparklineProps;
	export type Gradient = GradientConfig;
	export type DataPoint = SparklineDataPoint;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SparklineUnresponsive {
	export type Props = SparklineProps;
	export type Gradient = GradientConfig;
	export type DataPoint = SparklineDataPoint;
}
