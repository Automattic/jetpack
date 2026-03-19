/**
 * Pie chart namespace
 *
 * @example
 * ```tsx
 * import { PieChart } from '@automattic/charts';
 * import type { PieChart } from '@automattic/charts';
 *
 * const props: PieChart.Props = { data };
 * <PieChart {...props} />
 * <PieChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import { PieChart as PieChartComponent, PieChartUnresponsive } from '../charts/pie-chart';
import type { PieChartProps, PieChartRenderTooltipParams } from '../charts/pie-chart';

type PieChartNamespace = typeof PieChartComponent & {
	readonly Unresponsive: typeof PieChartUnresponsive;
};

export const PieChart: PieChartNamespace = Object.assign( PieChartComponent, {
	Unresponsive: PieChartUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PieChart {
	export type Props = PieChartProps;
	export type RenderTooltipParams = PieChartRenderTooltipParams;
}
