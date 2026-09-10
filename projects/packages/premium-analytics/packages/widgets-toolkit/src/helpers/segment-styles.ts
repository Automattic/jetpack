/**
 * Style configuration for a single segment.
 */
export type SegmentStyle = {
	color: string;
};

export type ColorableItem = { color?: string };

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
