/**
 * External dependencies
 */
import { type BaseLegendItem, useGlobalChartsContext } from '@automattic/charts';
/**
 * Internal dependencies
 */
import { Legend, type LegendItem } from './legend';

type LegendWithThemeProps = {
	chartItems?: BaseLegendItem[];
	items: LegendItem[];
	withComparison?: boolean;
};

/**
 * Resolves the color for a legend item using the following priority:
 * 1. item.color (explicit per-item)
 * 2. chartItems color (matched by label)
 * 3. theme color (from GlobalChartsProvider)
 */
function resolveItemColor(
	item: LegendItem,
	index: number,
	chartItems: BaseLegendItem[] | undefined,
	getElementStyles: ( opts: { index: number } ) => { color: string }
): string {
	if ( item.color ) {
		return item.color;
	}

	const correspondingChartItem = chartItems?.find( chartItem => chartItem.label === item.label );

	if ( correspondingChartItem?.color ) {
		return correspondingChartItem.color;
	}

	return getElementStyles( { index } ).color;
}

/**
 * Legend wrapper that injects theme colors from GlobalChartsProvider.
 * Use this for widgets that render inside a GlobalChartsProvider context.
 *
 * For standalone usage, use the pure Legend component instead.
 *
 * @deprecated Prefer using the pure Legend component with explicit colors.
 *             This wrapper will be removed once all widgets are migrated.
 */
export function LegendWithTheme( {
	chartItems,
	items,
	withComparison = false,
}: LegendWithThemeProps ) {
	const { getElementStyles } = useGlobalChartsContext();

	// Resolve all colors before passing to Legend
	const itemsWithColors = items.map( ( item, index ) => ( {
		...item,
		color: resolveItemColor( item, index, chartItems, getElementStyles ),
	} ) );

	return <Legend items={ itemsWithColors } withComparison={ withComparison } />;
}
