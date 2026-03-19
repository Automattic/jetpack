/**
 * Sparkline chart namespace
 *
 * @example
 * ```tsx
 * import { Sparkline } from '@automattic/charts';
 * import type { Sparkline } from '@automattic/charts';
 *
 * const props: Sparkline.Props = { data };
 * <Sparkline {...props} />
 * <Sparkline.Unresponsive data={data} width={100} height={30} />
 * ```
 */
import { Sparkline as SparklineComponent, SparklineUnresponsive } from '../charts/sparkline';
import type { SparklineProps, GradientConfig, SparklineDataPoint } from '../charts/sparkline';

type SparklineNamespace = typeof SparklineComponent & {
	readonly Unresponsive: typeof SparklineUnresponsive;
};

export const Sparkline: SparklineNamespace = Object.assign( SparklineComponent, {
	Unresponsive: SparklineUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Sparkline {
	export type Props = SparklineProps;
	export type Gradient = GradientConfig;
	export type DataPoint = SparklineDataPoint;
}
