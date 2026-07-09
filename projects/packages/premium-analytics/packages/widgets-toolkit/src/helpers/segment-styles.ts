/**
 * Style configuration for a single segment.
 */
export type SegmentStyle = {
	/** Segment fill color */
	color: string;
};

/**
 * Item with optional color property.
 */
export type ColorableItem = { color?: string };

/**
 * Segment data with optional color property.
 */
type SegmentData = { color?: string };

/**
 * Resolves segment styles from either the explicit styles prop or chartData.
 * Priority: styles prop > chartData[].color
 *
 * @param stylesProp - Explicit styles passed as component prop
 * @param chartData  - Chart data (may contain color per segment)
 * @return Array of resolved styles, one per segment
 */
export function resolveSegmentStyles(
	stylesProp: SegmentStyle[] | undefined,
	chartData: SegmentData[]
): SegmentStyle[] {
	if ( stylesProp?.length ) {
		return stylesProp;
	}

	return chartData.map( segment => ( {
		color: segment.color ?? '',
	} ) );
}

/**
 * Applies resolved styles (colors) to an array of items.
 * Works with any item type that has an optional color property.
 *
 * @param items          - Array of items to style
 * @param resolvedStyles - Styles to apply
 * @return Items with styles applied
 */
export function applyStylesToItems< T extends ColorableItem >(
	items: T[],
	resolvedStyles: SegmentStyle[]
): T[] {
	return items.map( ( item, index ) => {
		const style = resolvedStyles[ index ] ?? resolvedStyles[ 0 ];
		return {
			...item,
			color: style?.color || item.color,
		};
	} );
}
