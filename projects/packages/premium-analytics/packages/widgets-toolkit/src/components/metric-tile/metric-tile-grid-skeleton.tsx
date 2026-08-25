/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { SkeletonRoot } from '../widget-skeleton';
import styles from './metric-tile-grid-skeleton.module.scss';

const DEFAULT_TILE_COUNT = 4;

export interface MetricTileGridSkeletonProps {
	/** Tiles to draw; pass the widget's own tile count so the grid lands where the tiles will. */
	tiles?: number;
}

/**
 * Loading shape for `MetricTileGrid`: a label and value placeholder per metric,
 * stacked as full-width rows and switching to a centred row of columns at the
 * same width the loaded grid does.
 *
 * @param props       - Component props.
 * @param props.tiles - Tiles to draw.
 * @return The rendered skeleton.
 */
export function MetricTileGridSkeleton( {
	tiles = DEFAULT_TILE_COUNT,
}: MetricTileGridSkeletonProps ) {
	// Every caller passes a count it knows before the response, but that count
	// is 0 when the user has switched every metric off; drawing it literally
	// would leave an empty loading state.
	const tileCount = tiles > 0 ? tiles : DEFAULT_TILE_COUNT;

	return (
		<SkeletonRoot>
			<div className={ styles.container }>
				<div className={ styles.tiles }>
					{ Array.from( { length: tileCount }, ( _, index ) => (
						<div key={ index } className={ styles.tile } data-testid="skeleton-tile">
							<Skeleton className={ styles.label } />
							<Skeleton className={ styles.value } />
						</div>
					) ) }
				</div>
			</div>
		</SkeletonRoot>
	);
}
