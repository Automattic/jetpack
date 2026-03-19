/**
 * Geo chart namespace
 *
 * @example
 * ```tsx
 * import { GeoChart } from '@automattic/charts';
 * import type { GeoChart } from '@automattic/charts';
 *
 * const props: GeoChart.Props = { data };
 * <GeoChart {...props} />
 * <GeoChart.Unresponsive data={data} width={400} height={300} />
 * ```
 */
import { GeoChart as GeoChartComponent, GeoChartUnresponsive } from '../charts/geo-chart';
import type { GeoChartProps, GeoRegion, GeoResolution } from '../charts/geo-chart';

type GeoChartNamespace = typeof GeoChartComponent & {
	readonly Unresponsive: typeof GeoChartUnresponsive;
};

export const GeoChart: GeoChartNamespace = Object.assign( GeoChartComponent, {
	Unresponsive: GeoChartUnresponsive,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GeoChart {
	export type Props = GeoChartProps;
	export type Region = GeoRegion;
	export type Resolution = GeoResolution;
}
