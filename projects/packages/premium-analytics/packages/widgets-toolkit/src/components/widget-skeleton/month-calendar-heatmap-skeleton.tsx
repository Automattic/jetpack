/**
 * External dependencies
 */
import { Skeleton } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './month-calendar-heatmap-skeleton.module.scss';
import { SkeletonRoot } from './skeleton-root';

const MONTHS = 12;

/** Loading shape for a month calendar heatmap: a block and a label per month. */
export function MonthCalendarHeatmapSkeleton() {
	return (
		<SkeletonRoot>
			{ /* Own wrapper: SkeletonRoot's hidden label is a real element, and the
			     row must not lay it out as a month. */ }
			<div className={ styles.months }>
				{ Array.from( { length: MONTHS }, ( _, index ) => (
					<div key={ index } className={ styles.month } data-testid="skeleton-month">
						<Skeleton className={ styles.grid } />
						<Skeleton className={ styles.label } />
					</div>
				) ) }
			</div>
		</SkeletonRoot>
	);
}
