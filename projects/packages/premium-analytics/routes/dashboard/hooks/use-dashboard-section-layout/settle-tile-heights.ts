/**
 * Internal dependencies
 */
import { TILE_ROWS } from '../../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A widget's stored height, undefined on the masonry placement, which has none.
 *
 * @param widget - The widget, if any.
 * @return Its height in rows.
 */
export function heightOf( widget?: DashboardWidget ): number | undefined {
	const placement = widget?.placement;
	return placement && 'height' in placement ? placement.height : undefined;
}

/**
 * Gives a committed layout's tiles a height their content can use. The
 * dashboard package inserts a widget at two rows and lets a resize go to one,
 * sizes meant for 200px rows that are a sliver on 40px ones. A tile that
 * joined below the strip height takes the section default's height for its
 * type, else the card height; one that was resized below it stops at the strip.
 *
 * @param next           - The layout the dashboard committed.
 * @param previous       - The layout it was committed over.
 * @param sectionDefault - The section's default layout.
 * @return `next` itself when every height already clears the floor.
 */
export function settleTileHeights(
	next: DashboardWidget[],
	previous: DashboardWidget[],
	sectionDefault: DashboardWidget[]
): DashboardWidget[] {
	const known = new Set( previous.map( widget => widget.uuid ) );
	let changed = false;

	const settled = next.map( widget => {
		const height = heightOf( widget );
		if ( typeof height !== 'number' || height >= TILE_ROWS.strip ) {
			return widget;
		}
		changed = true;
		const rows = known.has( widget.uuid )
			? TILE_ROWS.strip
			: ( heightOf( sectionDefault.find( candidate => candidate.type === widget.type ) ) ??
				TILE_ROWS.card );
		return { ...widget, placement: { ...widget.placement, height: rows } };
	} );

	return changed ? settled : next;
}
