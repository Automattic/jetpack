/**
 * Bar list chart namespace
 *
 * @example
 * ```tsx
 * import { BarListChart } from '@automattic/charts';
 * import type { BarListChart } from '@automattic/charts';
 *
 * const props: BarListChart.Props = { data };
 * <BarListChart {...props} />
 * <BarListChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import {
	BarListChart as BarListChartComponent,
	BarListChartUnresponsive,
} from '../charts/bar-list-chart';
import type {
	BarListChartProps,
	RenderLabelProps,
	RenderValueProps,
} from '../charts/bar-list-chart';

type BarListChartNamespace = typeof BarListChartComponent & {
	readonly Unresponsive: typeof BarListChartUnresponsive;
};

export const BarListChart: BarListChartNamespace = Object.assign( BarListChartComponent, {
	Unresponsive: BarListChartUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BarListChart {
	export type Props = BarListChartProps;
	export type RenderLabel = RenderLabelProps;
	export type RenderValue = RenderValueProps;
}
