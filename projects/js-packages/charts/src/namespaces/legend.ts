/**
 * Legend component namespace
 *
 * @example
 * ```tsx
 * import { Legend } from '@automattic/charts';
 * import type { Legend } from '@automattic/charts';
 *
 * const props: Legend.Props = { items };
 * <Legend {...props} />
 * ```
 */
import { Legend as LegendComponent, useChartLegendItems } from '../components/legend';
import type {
	LegendProps,
	BaseLegendProps,
	ChartLegendOptions,
	LegendValueDisplay,
	BaseLegendItem,
} from '../components/legend';

type LegendNamespace = typeof LegendComponent & {
	readonly useChartLegendItems: typeof useChartLegendItems;
};

export const Legend: LegendNamespace = Object.assign( LegendComponent, {
	useChartLegendItems,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Legend {
	export type Props = LegendProps;
	export type BaseProps = BaseLegendProps;
	export type Options = ChartLegendOptions;
	export type ValueDisplay = LegendValueDisplay;
	export type Item = BaseLegendItem;
}
