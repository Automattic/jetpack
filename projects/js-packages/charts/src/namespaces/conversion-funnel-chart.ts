/**
 * Conversion funnel chart namespace
 *
 * @example
 * ```tsx
 * import { ConversionFunnelChart } from '@automattic/charts';
 * import type { ConversionFunnelChart } from '@automattic/charts';
 *
 * const props: ConversionFunnelChart.Props = { steps };
 * <ConversionFunnelChart {...props} />
 * ```
 */
import { ConversionFunnelChart as ConversionFunnelChartComponent } from '../charts/conversion-funnel-chart';
import type {
	ConversionFunnelChartProps,
	FunnelStep,
	StepLabelRenderProps,
	StepRateRenderProps,
	MainMetricRenderProps,
	TooltipRenderProps,
} from '../charts/conversion-funnel-chart';

export const ConversionFunnelChart = ConversionFunnelChartComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConversionFunnelChart {
	export type Props = ConversionFunnelChartProps;
	export type Step = FunnelStep;
	export type StepLabelRender = StepLabelRenderProps;
	export type StepRateRender = StepRateRenderProps;
	export type MainMetricRender = MainMetricRenderProps;
	export type TooltipRender = TooltipRenderProps;
}
