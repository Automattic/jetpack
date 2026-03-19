/**
 * Hooks namespace - utility hooks for chart functionality.
 *
 * @example
 * ```tsx
 * import { Hooks } from '@automattic/charts';
 *
 * const theme = Hooks.useGlobalChartsTheme();
 * const items = Hooks.useChartLegendItems(data, options);
 * ```
 */

import { useChartLegendItems } from '../components/legend';
import { useKeyboardNavigation } from '../components/tooltip';
import { useGlobalChartsContext, useGlobalChartsTheme } from '../providers';

export const Hooks = {
	/** Access global charts context */
	useGlobalChartsContext,
	/** Access current chart theme */
	useGlobalChartsTheme,
	/** Generate legend items from chart data */
	useChartLegendItems,
	/** Keyboard navigation for accessible tooltips */
	useKeyboardNavigation,
};
