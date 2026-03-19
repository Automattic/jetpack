/**
 * TrendIndicator component namespace
 *
 * @example
 * ```tsx
 * import { TrendIndicator } from '@automattic/charts';
 * import type { TrendIndicator } from '@automattic/charts';
 *
 * const props: TrendIndicator.Props = { value: 10, direction: 'up' };
 * <TrendIndicator {...props} />
 * ```
 */
import { TrendIndicator as TrendIndicatorComponent } from '../components/trend-indicator';
import type { TrendIndicatorProps, TrendDirection } from '../components/trend-indicator';

export const TrendIndicator = TrendIndicatorComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TrendIndicator {
	export type Props = TrendIndicatorProps;
	export type Direction = TrendDirection;
}
