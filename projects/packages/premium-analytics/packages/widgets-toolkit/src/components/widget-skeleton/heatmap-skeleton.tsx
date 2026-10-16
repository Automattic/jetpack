/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './heatmap-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';

/** The design prototype's grid: 28 week columns of 3 cells. */
const COLUMNS = 28;
const ROWS = 3;

/**
 * Loading shape for the calendar-heatmap widgets: a fixed grid of square cells,
 * deliberately not derived from the widget — the real column count is only
 * known after first paint, and tracking it would read as the jump this prevents.
 *
 * @return The rendered skeleton.
 */
export function HeatmapSkeleton() {
	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     grid must not lay it out as a cell. */ }
			<div className={ styles.grid }>
				{ Array.from( { length: COLUMNS * ROWS }, ( _, index ) => (
					<Skeleton key={ index } className={ styles.cell } data-testid="skeleton-cell" />
				) ) }
			</div>
		</SkeletonRoot>
	);
}
