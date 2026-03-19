/**
 * Bar chart namespace
 *
 * @example
 * ```tsx
 * import { BarChart } from '@automattic/charts';
 * import type { BarChart } from '@automattic/charts';
 *
 * const props: BarChart.Props = { data };
 * <BarChart {...props} />
 * <BarChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import { BarChart as BarChartComponent, BarChartUnresponsive } from '../charts/bar-chart';
import type { BarChartProps } from '../charts/bar-chart';

type BarChartNamespace = typeof BarChartComponent & {
	readonly Unresponsive: typeof BarChartUnresponsive;
};

export const BarChart: BarChartNamespace = Object.assign( BarChartComponent, {
	Unresponsive: BarChartUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarChart {
	export type Props = BarChartProps;
}
