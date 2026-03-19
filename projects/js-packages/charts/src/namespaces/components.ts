/**
 * Component exports with namespaced types.
 */

import { Legend as LegendComponent, useChartLegendItems } from '../components/legend';
import { BaseTooltip, AccessibleTooltip, useKeyboardNavigation } from '../components/tooltip';
import { TrendIndicator as TrendIndicatorComponent } from '../components/trend-indicator';
import type {
	LegendProps,
	BaseLegendProps,
	BaseLegendItem,
	ChartLegendOptions,
	LegendValueDisplay,
} from '../components/legend';
import type {
	BaseTooltipProps,
	TooltipData,
	TooltipProps,
	AccessibleTooltipProps,
	UseKeyboardNavigationProps,
} from '../components/tooltip';
import type { TrendIndicatorProps, TrendDirection } from '../components/trend-indicator';

// ============================================================================
// Legend
// ============================================================================

export const Legend = Object.assign( LegendComponent, {
	useChartLegendItems,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Legend {
	export type Props = LegendProps;
	export type BaseProps = BaseLegendProps;
	export type Item = BaseLegendItem;
	export type Options = ChartLegendOptions;
	export type ValueDisplay = LegendValueDisplay;
}

// ============================================================================
// Tooltip
// ============================================================================

export const Tooltip = {
	Base: BaseTooltip,
	Accessible: AccessibleTooltip,
	useKeyboardNavigation,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Tooltip {
	export type Props = TooltipProps;
	export type BaseProps = BaseTooltipProps;
	export type AccessibleProps = AccessibleTooltipProps;
	export type KeyboardNavigationProps = UseKeyboardNavigationProps;
	export type Data = TooltipData;
}

// ============================================================================
// TrendIndicator
// ============================================================================

export const TrendIndicator = TrendIndicatorComponent;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TrendIndicator {
	export type Props = TrendIndicatorProps;
	export type Direction = TrendDirection;
}
