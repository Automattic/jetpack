/**
 * Line chart namespace
 *
 * @example
 * ```tsx
 * import { LineChart } from '@automattic/charts';
 * import type { LineChart } from '@automattic/charts';
 *
 * const props: LineChart.Props = { data };
 * <LineChart {...props} />
 * <LineChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import { LineChart as LineChartComponent, LineChartUnresponsive } from '../charts/line-chart';
import type {
	LineChartProps,
	LineChartAnnotationProps,
	RenderLineGlyphProps,
	TooltipDatum,
	CurveType,
} from '../charts/line-chart';

type LineChartNamespace = typeof LineChartComponent & {
	readonly Unresponsive: typeof LineChartUnresponsive;
};

export const LineChart: LineChartNamespace = Object.assign( LineChartComponent, {
	Unresponsive: LineChartUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LineChart {
	export type Props = LineChartProps;
	export type AnnotationProps = LineChartAnnotationProps;
	export type RenderGlyphProps< Datum extends object > = RenderLineGlyphProps< Datum >;
	export type TooltipDatumType = TooltipDatum;
	export type Curve = CurveType;
}
