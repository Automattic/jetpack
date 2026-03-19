/**
 * Pie semi-circle chart namespace
 *
 * @example
 * ```tsx
 * import { PieSemiCircleChart } from '@automattic/charts';
 * import type { PieSemiCircleChart } from '@automattic/charts';
 *
 * const props: PieSemiCircleChart.Props = { data };
 * <PieSemiCircleChart {...props} />
 * <PieSemiCircleChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import {
	PieSemiCircleChart as PieSemiCircleChartComponent,
	PieSemiCircleChartUnresponsive,
} from '../charts/pie-semi-circle-chart';
import type {
	PieSemiCircleChartProps,
	PieSemiCircleChartRenderTooltipParams,
	ArcData,
} from '../charts/pie-semi-circle-chart';

type PieSemiCircleChartNamespace = typeof PieSemiCircleChartComponent & {
	readonly Unresponsive: typeof PieSemiCircleChartUnresponsive;
};

export const PieSemiCircleChart: PieSemiCircleChartNamespace = Object.assign(
	PieSemiCircleChartComponent,
	{
		Unresponsive: PieSemiCircleChartUnresponsive,
	}
);

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieSemiCircleChart {
	export type Props = PieSemiCircleChartProps;
	export type RenderTooltipParams = PieSemiCircleChartRenderTooltipParams;
	export type Arc = ArcData;
}
