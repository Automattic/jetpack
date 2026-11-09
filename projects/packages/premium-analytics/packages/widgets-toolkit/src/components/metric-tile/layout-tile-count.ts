// Highest tile count the layout rules cover; keep in step with `$max-tile-count`.
const MAX_TILE_COUNT = 8;

/**
 * The tile count the layout rules read from `data-tile-count`. They are written
 * per count, so a longer grid takes the rules of the highest one.
 *
 * @param tileCount - Tiles the grid renders.
 * @return The count to write to `data-tile-count`.
 */
export function getLayoutTileCount( tileCount: number ): number {
	return Math.min( tileCount, MAX_TILE_COUNT );
}
