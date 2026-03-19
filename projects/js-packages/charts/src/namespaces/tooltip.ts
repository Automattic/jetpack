/**
 * Tooltip component namespace
 *
 * @example
 * ```tsx
 * import { Tooltip } from '@automattic/charts';
 * import type { Tooltip } from '@automattic/charts';
 *
 * const props: Tooltip.Props = { ... };
 * <Tooltip.Base {...props} />
 * ```
 */
import { BaseTooltip } from '../components/tooltip';
import type { BaseTooltipProps, TooltipData, TooltipProps } from '../components/tooltip';

interface TooltipNamespace {
	readonly Base: typeof BaseTooltip;
}

export const Tooltip: TooltipNamespace = {
	Base: BaseTooltip,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Tooltip {
	export type BaseProps = BaseTooltipProps;
	export type Data = TooltipData;
	export type Props = TooltipProps;
}
